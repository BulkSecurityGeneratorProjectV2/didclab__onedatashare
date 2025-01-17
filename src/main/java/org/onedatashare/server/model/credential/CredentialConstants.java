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


package org.onedatashare.server.model.credential;

import edu.emory.mathcs.backport.java.util.Arrays;
import org.onedatashare.server.model.core.EndpointType;

import java.util.HashSet;

public class CredentialConstants {
    public static final HashSet<EndpointType> ACCOUNT_CRED_TYPE = new HashSet<>(Arrays.asList(new EndpointType[]{
            EndpointType.s3, EndpointType.ftp, EndpointType.http, EndpointType.sftp
    }));

    public static final HashSet<EndpointType> OAUTH_CRED_TYPE = new HashSet<>(Arrays.asList(new EndpointType[]{
            EndpointType.box, EndpointType.dropbox, EndpointType.gdrive, EndpointType.gftp
    }));
}
