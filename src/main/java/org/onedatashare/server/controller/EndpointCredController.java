package org.onedatashare.server.controller;

import org.onedatashare.server.model.core.AuthType;
import org.onedatashare.server.model.core.CredList;
import org.onedatashare.server.model.core.EndpointType;
import org.onedatashare.server.model.credential.AccountEndpointCredential;
import org.onedatashare.server.service.CredentialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.security.Principal;

@RestController
@RequestMapping("/api/cred/")
public class EndpointCredController {
    @Autowired
    private CredentialService credentialService;

    @PostMapping("{type}")
    public Mono<Object> saveCredential(@RequestBody AccountEndpointCredential credential, @PathVariable AuthType type,
                                       Mono<Principal> principalMono) {
        return principalMono.map(Principal::getName)
                .flatMap(user -> credentialService.createCredential(credential, user,
                        EndpointType.valueOf(type.toString())));
    }

    @GetMapping("{type}")
    public Mono<CredList> getCredential(@PathVariable EndpointType type, Mono<Principal> principalMono) {
        return principalMono.map(Principal::getName)
                .flatMap(user -> credentialService.getStoredCredentialNames(user, type));
    }

    @DeleteMapping("{type}/{credId}")
    public Mono<Void> deleteCredential(@PathVariable String credId, @PathVariable EndpointType type,
                                       Mono<Principal> principalMono) {
        return principalMono.map(Principal::getName)
                .flatMap(user -> credentialService.deleteCredential(user, type, credId));
    }
}
