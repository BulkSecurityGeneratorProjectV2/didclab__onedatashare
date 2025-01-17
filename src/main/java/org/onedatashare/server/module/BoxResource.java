package org.onedatashare.server.module;

import com.box.sdk.*;

import org.onedatashare.server.model.core.Stat;
import org.onedatashare.server.model.credential.EndpointCredential;
import org.onedatashare.server.model.credential.OAuthEndpointCredential;
import org.onedatashare.server.model.error.ODSAccessDeniedException;
import org.onedatashare.server.model.filesystem.operations.DeleteOperation;
import org.onedatashare.server.model.filesystem.operations.DownloadOperation;
import org.onedatashare.server.model.filesystem.operations.ListOperation;
import org.onedatashare.server.model.filesystem.operations.MkdirOperation;
import org.onedatashare.server.service.ODSLoggerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

public class BoxResource extends Resource {
    private BoxAPIConnection client;
    Logger logger = LoggerFactory.getLogger(BoxResource.class);

    @Value("${box.clientId}")
    private String clientId;

    @Value("${box.clientSecret}")
    private String clientSecret;


    public BoxResource(EndpointCredential credential) {
        super(credential);
        OAuthEndpointCredential oAuthEndpointCredential = (OAuthEndpointCredential) credential;
        this.client = new BoxAPIConnection(oAuthEndpointCredential.getToken());
    }

    public static Mono<? extends Resource> initialize(EndpointCredential credential) {
        return Mono.create(s -> {
            try {
                BoxResource boxResource = new BoxResource(credential);
                s.success(boxResource);
            } catch (Exception e) {
                s.error(e);
            }
        });
    }

    @Override
    public Mono<Void> delete(DeleteOperation operation) {
        return Mono.create(s -> {
            try {
                BoxFile file = new BoxFile(this.client, operation.getToDelete());
                file.delete();
                s.success();
            } catch (BoxAPIException boxAPIException) {
                logger.error("Failed to delete this id " + operation.getToDelete() + "as a file but failedEndpointAuthenticateComponent.js");
            }
            try {
                BoxFolder folder = new BoxFolder(this.client, operation.getToDelete());
                folder.delete(true);
                s.success();
            } catch (BoxAPIException boxAPIResponseException) {
                logger.error("Failed to delete this id " + operation.getToDelete() + " as a folder recursively but failed");
            }
            s.success();
        });
    }

    @Override
    public Mono<Stat> list(ListOperation operation) {
        return Mono.create(s -> {
                Stat betterStat = new Stat();
                if (operation.getId().isEmpty() || operation.getId().equals("/") || operation.getId().equals("0")) {
                    operation.setId("0");
                }
                BoxFolder folder = new BoxFolder(this.client, operation.getId()); //generally speaking u would only ever list a directory
                betterStat.setDir(true).setFile(false);
                betterStat.setId(folder.getID());
                betterStat.setName(folder.getInfo().getName());
                betterStat.setSize(folder.getInfo().getSize());
                List<Stat> childList = new ArrayList<>();
                Iterable<BoxItem.Info> items = folder.getChildren();
                for (BoxItem.Info itemInfo : items) {
                    if (itemInfo instanceof BoxFile.Info) {
                        BoxFile file = new BoxFile(this.client, itemInfo.getID());
                        BoxFile.Info fileInfo = file.getInfo();
                        childList.add(boxFileToStat(fileInfo));
                    } else if (itemInfo instanceof BoxFolder.Info) {
                        folder = new BoxFolder(this.client, itemInfo.getID());
                        BoxFolder.Info folderInfo = folder.getInfo();
                        childList.add(boxFolderToStat(folderInfo));
                    }
                }
                betterStat.setFiles(childList);
                betterStat.setFilesList(childList);
                s.success(betterStat);

        });
    }

    @Override
    public Mono<Void> mkdir(MkdirOperation operation) {
        return Mono.create(s -> {
            String[] pathToMake = operation.getFolderToCreate().split("/");
            BoxFolder parentFolder = null;
            String operationId = operation.getId();
            if(operation.getId() == null){
                parentFolder = new BoxFolder(this.client,"0");
            }else if (operation.getId().isEmpty() || operation.getId().equals("0")) {
                parentFolder = new BoxFolder(this.client,"0");
            } else {
                parentFolder = new BoxFolder(this.client, operationId);
            }
            for (String partOfPath : pathToMake) {
                ODSLoggerService.logInfo(partOfPath);
                BoxFolder.Info folder = parentFolder.createFolder(partOfPath);
                operationId = folder.getID();
                parentFolder = new BoxFolder(this.client, operationId);
            }
            s.success();
        });
    }

    /**
     * this is not needed as we do not offer downloading over browser anymore.
     * The reason is there is no optimization applied to the download then.
     * Leaving this incase we decide to change this
     *
     * @param operation
     * @return
     */
    @Override
    public Mono download(DownloadOperation operation) {
        return Mono.create(s -> {
            String url = "";
            try {
                BoxFile file = new BoxFile(this.client, operation.getId());
                url = file.getDownloadURL().toString();
                s.success(url);
            } catch (BoxAPIResponseException be) {
                if (be.getResponseCode() == 403) {
                    s.error(new ODSAccessDeniedException(403));
                }
            } catch (Exception e) {
                s.error(e);
            }
        });
    }

    public Stat boxFileToStat(BoxFile.Info fileInfo) {
        Stat stat = new Stat();
        stat.setId(fileInfo.getID());
        stat.setName(fileInfo.getName());
        stat.setSize(fileInfo.getSize());
        stat.setTime(fileInfo.getModifiedAt().getTime() / 1000);
        stat.setFile(true);
        stat.setDir(false);
        try {
            stat.setPermissions(fileInfo.getPermissions().toString());
        } catch (NullPointerException ignored) {
        }
        return stat;
    }

    public Stat boxFolderToStat(BoxFolder.Info folderInfo) {
        Stat stat = new Stat();
        stat.setFiles(new ArrayList<>());
        stat.setId(folderInfo.getID());
        stat.setSize(folderInfo.getSize());
        stat.setName(folderInfo.getName());
        stat.setTime(folderInfo.getModifiedAt().getTime() / 1000);
        stat.setFile(false);
        stat.setDir(true);
        try {
            stat.setPermissions(folderInfo.getPermissions().toString());
        } catch (NullPointerException ignored) {
        }
        return stat;
    }
}