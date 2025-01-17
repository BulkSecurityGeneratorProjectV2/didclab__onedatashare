package org.onedatashare.server.service;

import org.onedatashare.server.model.core.Stat;
import org.onedatashare.server.model.filesystem.operations.DeleteOperation;
import org.onedatashare.server.model.filesystem.operations.DownloadOperation;
import org.onedatashare.server.model.filesystem.operations.ListOperation;
import org.onedatashare.server.model.filesystem.operations.MkdirOperation;
import org.onedatashare.server.module.Resource;
import reactor.core.publisher.Mono;

import java.util.List;

public abstract class ResourceServiceBase {

    protected abstract Mono<? extends Resource> getResource(String credId);

    public abstract Mono<Void> delete(DeleteOperation operation);
    public abstract Mono<Stat> list(ListOperation operation);
    public abstract Mono<Void> mkdir(MkdirOperation operation);
    public abstract Mono<String> download(DownloadOperation operation);

}
