package org.onedatashare.server.service;

import com.jcraft.jsch.Channel;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.onedatashare.server.model.useraction.UserAction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class SSHConsoleService {

    private JSch jsch;

    @Autowired
    private DecryptionService decryptionService;

    public SSHConsoleService() {
        jsch = new JSch();
    }

    public Mono<Session> createSession(String uri, String userName, String password, Integer port) {
//        return Mono.create(sink -> {
//            Session session = null;
//            try {
//                session = jsch.getSession(userName, uri, port);
//            } catch (Exception e) {
//                ODSLoggerService.logError("Error occurred while trying to create SSH session for " + userName);
//                sink.error(new Exception("Failed to create SSH session"));
//            }
//            session.setUserInfo(new SSHUserInfo(decryptionService.getDecryptedPassword(password)));
//            sink.success(session);
//        });
        return null;
    }

    public Flux runCommand(UserAction ua, String commandWithPath) {
//        return createSession(ua.getUri(), ua.getCredential().getUsername(), ua.getCredential().getPassword(), Integer.parseInt(ua.getPortNumber()))
//                .flux()
//                .flatMap(session -> {
//                    try {
//                        session.connect();
//                        ChannelExec channel = (ChannelExec)session.openChannel("exec");
//                        channel.setCommand(commandWithPath);
//                        return connectAndReadOutput(channel);
//                    }
//                    catch(Exception e){
//                        ODSLoggerService.logError("Error occurred while executing SSH command");
//                        e.printStackTrace();
//                        return Flux.error(new Exception("Error occurred while executing SSH command"));
//                    }
//                });
        return null;
    }

    public Flux connectAndReadOutput(Channel channel) {
//        try {
//            InputStream in = channel.getInputStream();
//            InputStream err = channel.getExtInputStream();
//
//            channel.connect();
//
//            StringBuilder outputBuffer = new StringBuilder();
//            StringBuilder errorBuffer = new StringBuilder();
//
//            byte[] tmp = new byte[1024];
//            while (true) {
//                while (in.available() > 0) {
//                    int i = in.read(tmp, 0, 1024);
//                    if (i < 0) break;
//                    outputBuffer.append(new String(tmp, 0, i));
//                }
//                while (err.available() > 0) {
//                    int i = err.read(tmp, 0, 1024);
//                    if (i < 0) break;
//                    errorBuffer.append(new String(tmp, 0, i));
//                }
//                if (channel.isClosed()) {
//                    if ((in.available() > 0) || (err.available() > 0))
//                        continue;
//                    break;
//                }
//                try {
//                    Thread.sleep(500);
//                } catch (Exception ee) {
//                }
//            }
//            channel.disconnect();
//            ShellCommandResponse response = new ShellCommandResponse();
//            response.setOutput(outputBuffer.toString());
//            if(errorBuffer.length() > 0){
//                response.setError(errorBuffer.toString());
//            }
//            return Flux.just(response);
        return null;
    }
}


