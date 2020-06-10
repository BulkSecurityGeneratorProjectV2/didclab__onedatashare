package org.onedatashare.server.controller;

import org.onedatashare.server.model.core.AuthType;
import org.onedatashare.server.model.core.EndpointType;
import org.onedatashare.server.model.credential.AccountEndpointCredential;
import org.onedatashare.server.service.CredentialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth/")
public class EndpointAuthController {
    @Autowired
    private CredentialService credentialService;

    @PostMapping("{type}")
    public Mono<Void> saveCredential(@RequestBody AccountEndpointCredential credential, @PathVariable AuthType type,
                                     Mono<Principal> principalMono){
        return principalMono.map(Principal::getName)
                .flatMap(user -> credentialService.createCredential(credential, user,
                        EndpointType.valueOf(type.toString())));
    }
}