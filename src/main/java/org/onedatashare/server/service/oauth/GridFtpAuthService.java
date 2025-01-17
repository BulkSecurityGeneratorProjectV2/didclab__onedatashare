package org.onedatashare.server.service.oauth;

import lombok.Getter;
import org.onedatashare.module.globusapi.GlobusClient;
import org.onedatashare.server.model.credential.OAuthEndpointCredential;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import javax.annotation.PostConstruct;
import java.util.Map;

@Getter
@Configuration
class GridFTPConfig{
    @Value("${gftp.clientId}")
    private String clientId;
    @Value("${gftp.clientSecret}")
    private String clientSecret;
    @Value("${gftp.redirectUri}")
    private String redirectUri;
}

@Service
public class GridFtpAuthService {
    private GlobusClient globusclient = new GlobusClient();

    @Autowired
    private GridFTPConfig gridFTPConfig;

    private static final Logger logger = LoggerFactory.getLogger(GridFtpAuthService.class);

    @PostConstruct
    public void initializeGlobusClient(){
        globusclient.setRedirectUri(gridFTPConfig.getRedirectUri())
                .setClientId(gridFTPConfig.getClientId())
                .setClientSecret(gridFTPConfig.getClientSecret());
    }

    public String start() {
        try {
            String url = globusclient.generateAuthURL();
            return url;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public Mono<OAuthEndpointCredential> finish(Map<String, String> queryParameters) {
        String token = queryParameters.get("code");
        return globusclient.getAccessToken(token)
                .map(accessToken -> {
                    OAuthEndpointCredential credential = new OAuthEndpointCredential("GridFTP Client")
                            .setToken(accessToken.getTransferAccessToken())
                            .setRefreshToken(accessToken.getRefreshToken())
                            .setExpiresAt(accessToken.getExpiredTime());
                    return credential;
                });
    }
}
