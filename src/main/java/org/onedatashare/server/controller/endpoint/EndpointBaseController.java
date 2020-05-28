/**
 ##**************************************************************
 ##
 ## Copyright (C) 2018-2020, OneDataShare Team, 
 ## Department of Computer Science and Engineering,
 ## University at Buffalo, Buffalo, NY, 14260.
 ## 
 ## Licensed under the Apache License, Version 2.0 (the "License"); you
 ## may not use this file except in compliance with the License.  You may
 ## obtain a copy of the License at
 ## 
 ##    http://www.apache.org/licenses/LICENSE-2.0
 ## 
 ## Unless required by applicable law or agreed to in writing, software
 ## distributed under the License is distributed on an "AS IS" BASIS,
 ## WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 ## See the License for the specific language governing permissions and
 ## limitations under the License.
 ##
 ##**************************************************************
 */


package org.onedatashare.server.controller.endpoint;

import org.onedatashare.server.model.core.Stat;
import org.onedatashare.server.model.error.AuthenticationRequired;
import org.onedatashare.server.model.error.DuplicateCredentialException;
import org.onedatashare.server.model.error.ODSAccessDeniedException;
import org.onedatashare.server.model.error.TokenExpiredException;
import org.onedatashare.server.model.filesystem.operations.ListOperation;
import org.onedatashare.server.model.request.OperationRequestData;
import org.onedatashare.server.model.request.RequestData;
import org.onedatashare.server.service.ODSLoggerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.result.view.Rendering;
import reactor.core.publisher.Mono;

public abstract class EndpointBaseController {
    
    @GetMapping("/ls")
    public Mono<Stat> list(@RequestParam String credId, @RequestParam String path,
                           @RequestParam String identifier) {
        ListOperation operation = ListOperation.builder()
                .credId(credId)
                .path(path)
                .id(identifier)
                .build();
        return listOperation(operation);
    }

    @PostMapping("/mkdir")
    public Mono<Void> mkdir(@RequestBody OperationRequestData operationRequestData){
        return mkdirOperation(operationRequestData);
    }

    @PostMapping("/rm")
    public Mono<Void> delete(@RequestBody OperationRequestData operationRequestData){
        return deleteOperation(operationRequestData);
    }

    @PostMapping("/download")
    public Mono download(@RequestBody RequestData requestData){
        return downloadOperation(requestData);
    }

    protected abstract Mono<Stat> listOperation(ListOperation listOperation);

    protected abstract Mono<Void> mkdirOperation(OperationRequestData operationRequestData);
    protected abstract Mono<Void> deleteOperation(OperationRequestData operationRequestData);
    protected abstract Mono<String> downloadOperation(RequestData requestData);

    @ExceptionHandler(AuthenticationRequired.class)
    public ResponseEntity<String> handle(AuthenticationRequired authenticationRequired) {
        return new ResponseEntity<>(authenticationRequired.toString(), authenticationRequired.status);
    }

    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<String> handle(TokenExpiredException tokenExpiredException) {
        return new ResponseEntity<>(tokenExpiredException.toString(), tokenExpiredException.status);
    }

    @ExceptionHandler(ODSAccessDeniedException.class)
    public ResponseEntity<String> handle(ODSAccessDeniedException ade) {
        return new ResponseEntity<>("Access Denied Exception", HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(DuplicateCredentialException.class)
    public Rendering handle(DuplicateCredentialException dce) {
        ODSLoggerService.logError(dce.status.toString());
        return Rendering.redirectTo("/transfer").build();
    }

}