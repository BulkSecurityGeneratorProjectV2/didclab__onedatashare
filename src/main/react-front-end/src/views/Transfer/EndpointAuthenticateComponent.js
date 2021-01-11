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


import React, { Component } from 'react';
import PropTypes from "prop-types";
import {/*openDropboxOAuth, openGoogleDriveOAuth, openBoxOAuth,*/
		listFiles} from "../../APICalls/EndpointAPICalls";
import { globusFetchEndpoints, globusEndpointDetail, deleteEndpointId, globusEndpointActivateWeb } from "../../APICalls/globusAPICalls";
import { deleteHistory, deleteCredentialFromServer, history, savedCredList, saveEndpointCred } from "../../APICalls/APICalls";
import {/*DROPBOX_TYPE,
				GOOGLEDRIVE_TYPE,
				BOX_TYPE,
				FTP_TYPE,
				SFTP_TYPE,
				GRIDFTP_TYPE,
				HTTP_TYPE,*/
				ODS_PUBLIC_KEY,
				generateURLFromPortNumber,
				showDisplay
			} from "../../constants";
import {showType, isOAuth} from "../../constants";
import {OAuthFunctions} from "../../APICalls/EndpointAPICalls";
import {store} from "../../App";

import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Button from "@material-ui/core/Button";
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import {cookies} from "../../model/reducers.js";

import JSEncrypt from 'jsencrypt';

import Divider from '@material-ui/core/Divider';
import DataIcon from '@material-ui/icons/Laptop';
import BackIcon from '@material-ui/icons/KeyboardArrowLeft'
import AddIcon from '@material-ui/icons/AddToQueue';
import Modal from '@material-ui/core/Modal';
import {Dialog, DialogContent, DialogActions, DialogContentText, FormControlLabel, Checkbox} from "@material-ui/core";

import {getCred} from "./initialize_dnd.js";

import {eventEmitter} from "../../App";

import GlobusEndpointListingComponent from "./GlobusEndpointListingComponent";
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';



import {getType, getName, getDefaultPortFromUri, getTypeFromUri} from '../../constants.js';
import {styled} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import {CheckBox} from "@material-ui/icons";
export default class EndpointAuthenticateComponent extends Component {
	static propTypes = {
		loginSuccess : PropTypes.func,
		endpoint : PropTypes.object,
		history: PropTypes.array,
        credentials: PropTypes.object,
		type: PropTypes.string,
		back: PropTypes.func,
		setLoading : PropTypes.func,
		updateCredentials: PropTypes.func,
	}
	constructor(props){
		super(props);
		this.state={
			historyList: props.history,
			endpoint: props.endpoint,
			credList: props.credentials || {},
			endpointIdsList: {},
			settingAuth: false,
			settingAuthType: "",
			url: "",
			needPassword: false,
			username: "",
			password: "",
			endpointSelected: {},
			selectingEndpoint: false,
			portNum: -1,
			portNumField: true,
			rsa: "",
			pemFileName: "",
			pemFile: null,
			openModal: false,
			deleteFunc: () => {}
		};

		let loginType = getType(props.endpoint)
		let endpointName = getName(props.endpoint)
		if(loginType === showType.gsiftp /*loginType === GRIDFTP_TYPE*/){
			this.endpointIdsListUpdateFromBackend();
		}else if(!isOAuth[loginType]/*loginType === FTP_TYPE || loginType === SFTP_TYPE || loginType === HTTP_TYPE*/){
		    this.historyListUpdateFromBackend(endpointName);
		}
		this.handleChange = this.handleChange.bind(this);
		this._handleError = this._handleError.bind(this);
		this.handleUrlChange = this.handleUrlChange.bind(this);
		this.getEndpointListComponentFromList = this.getEndpointListComponentFromList.bind(this);
	}

	fieldLabelStyle = () => styled(Typography)({
		fontSize: "12px"
	})

	credentialListUpdateFromBackend = (type) => {
		this.props.setLoading(true);

		savedCredList(type, (data) =>{
			this.setState({credList: data? data.list: {}})
			this.props.updateCredentials(data);
			this.props.setLoading(false);
			}, (error) =>{
				this._handleError(error);
				this.props.setLoading(false);
		});
	}

	deleteCredentialFromLocal(cred, type){
		// if(window.confirm("Are you sure you want to delete this account from the list?")){
			this.props.setLoading(true);

			let parsedCredsArr = JSON.parse(cookies.get(type));
			let filteredCredsArr = parsedCredsArr.filter((curObj)=>{
				return curObj.name !== cred.name;
			});
			if(filteredCredsArr.length === 0){
				cookies.remove(type);
			}
			else{
				cookies.set(type, JSON.stringify(filteredCredsArr));
			}

			this.setState({credList: filteredCredsArr});

			this.props.setLoading(false);
		// }
	}

	endpointIdsListUpdateFromBackend = () => {
		this.props.setLoading(true);
		globusFetchEndpoints((data) => {
			this.setState({ endpointIdsList: data });
			this.props.setLoading(false);
		}, (error) => {
			this._handleError(error);
			this.props.setLoading(false);
		});
	}

	historyListUpdateFromBackend = (endpointType) => {
		savedCredList(endpointType, (data) =>{
			this.setState({historyList: data.filter((v) => { return v.indexOf(this.props.endpoint.uri) === 0 })});
			this.props.setLoading(false);
		}, (error) => {
			this._handleError("Unable to retrieve data from backend. Try log out or wait for few minutes.");
			this.props.setLoading(false);
		});
	}



	endpointListUpdateFromBackend = () => {
		this.props.setLoading(true);

	}

	_handleError = (msg) => {
    	eventEmitter.emit("errorOccured", msg);
	}

	handleChange = name => event => {
      this.setState({
        [name]: event.target.value
      });
	};

	handleUrlChange = event => {
		let url = event.target.value;
		let portNum = this.state.portNum;

		// Count the number of colons (2nd colon means the URL contains the portnumber)
		let colonCount = 0;
		for(let i=0; i < url.length; colonCount+=+(':'===url[i++]));
		
		url = generateURLFromPortNumber(url, portNum);

		this.setState({
			"portNumField": colonCount>=2 ? false : true,
			"url" : url
		});
	}

	handlePortNumChange = event => {
		let portNum = event.target.value;
		let url = this.state.url;
		
		url = generateURLFromPortNumber(url, portNum);

		this.setState({
			"portNum" : portNum,
			"url" : url
		});
	}

	endpointCheckin=(url, portNum, credential, callback) => {
		const {endpoint} = this.state;
		const type = showDisplay[getName(endpoint)].label;
		this.props.setLoading(true);

		console.log(`Url is ${url}`);

		let endpointSet = {
			uri: url,
			login: true,
			side: this.props.endpoint.side,
			credential: credential,
			portNumber: portNum
		}

		//Check for a valid endpoint
		if(! getTypeFromUri(endpointSet.uri)){
			this._handleError("Protocol is not understood");
		}

		// listFiles(url, endpointSet, null, (response) => {
		// 	saveEndpointCred(type,
		// 		{
		// 			uri: credential.url,
		// 			username: credential.name,
		// 			secret: credential.password,
		// 			accountId: credential.credId
		// 		},
		// 		 (suc) => {
		// 		 //console.log(suc)

		// 	}, (error) => {
		// 		this._handleError(error);
		// 	})
		// 	this.props.loginSuccess(endpointSet);
		// }, (error) => {
		// 	this.props.setLoading(false);
		// 	callback(error);
		// })
		saveEndpointCred(type,
			{
				uri: credential.url,
				username: credential.name,
				secret: credential.password,
				accountId: credential.credId
			},
			(response) => {
				listFiles(url, endpointSet, null, (succ) =>
					{
						this.props.loginSuccess(endpointSet);
					},
					(error) => {
						this.props.setLoading(false);
						callback(error);
					}
				)
			},
			(error) => {
				this._handleError(error);
			});
	}

	getEndpointListComponentFromList(endpointIdsList){
		return Object.keys(endpointIdsList)
			.map((v) =>
			<ListItem button key={v} onClick={() => {
				globusEndpointDetail(endpointIdsList[v].id, (resp) => {
					this.endpointModalLogin(resp);
				}, (error) => {
					this._handleError("Unable to get detail of this endpoint");
				})
			}}>
			  <ListItemIcon>
		        <DataIcon/>
		      </ListItemIcon>
	          <ListItemText primary={endpointIdsList[v].name} secondary={endpointIdsList[v].canonical_name}/>
	          <ListItemSecondaryAction>
	            <IconButton aria-label="Delete" onClick={() => {

					// this.setState({
						// 	deleteFunc: deleteEndpointId(endpointIdsList[v].id, (accept) => {
						// 		this.endpointIdsListUpdateFromBackend();
						// 	}, (error) => {
						// 		this._handleError("Delete Credential Failed");
						// 	})
						//
						// });

	            	deleteEndpointId(endpointIdsList[v].id, (accept) => {
	            		this.endpointIdsListUpdateFromBackend();
	            	}, (error) => {
	            		this._handleError("Delete Credential Failed");
	            	});
	            }}>
	              <DeleteIcon />
	            </IconButton>
	          </ListItemSecondaryAction>
	        </ListItem>
		);
	}

	getCredentialListComponentFromList(credList, type){
		const {endpoint} = this.state;
		const {loginSuccess} = this.props;
		
		if(store.getState().saveOAuthTokens){
			// If the user has opted to store tokens on ODS server
			// Note - Backend returns stored credentials as a nested JSON object
			return credList.filter(id => {
				return (!getCred().includes(id))})
				.map((v) =>
				<ListItem button key={v}
					onClick={() => {
						const endpointSet = {
							uri: endpoint.uri,
							login: true,
// 							credential: {uuid: v, name: credList[v].name, tokenSaved: true},
// 							side: endpoint.side,
							credential: {uuid: v, name: v, tokenSaved: true},
							side: endpoint.side
						}
						loginSuccess(endpointSet);
					}}
						  ContainerComponent="div"
				>
					<ListItemIcon>
						<DataIcon/>
					</ListItemIcon>
					<ListItemText primary={v} />
					<ListItemSecondaryAction>
						<IconButton aria-label="Delete" onClick={() => {
// 							deleteCredentialFromServer(v, (accept) => {
// 								this.credentialListUpdateFromBackend();
							deleteCredentialFromServer(v, type, (accept) => {
								this.credentialListUpdateFromBackend(type);
							}, (error) => {
								this._handleError("Delete Credential Failed");
							});
						}}>
							<DeleteIcon />
						</IconButton>
					</ListItemSecondaryAction>
				</ListItem>
			);
		}
		else{
			// If the user has opted not to store tokens on ODS server
			// Note - Local storage returns credentials as array of objects
			return credList.map((cred) =>
			<ListItem button onClick={() => {
					const endpointSet = {
						uri: endpoint.uri,
						login: true,
						credential: {name: cred.name, tokenSaved: false, token: cred.token},
						side: endpoint.side,
						oauth: true
					}
					loginSuccess(endpointSet);
				}}>
				<ListItemIcon>
					<DataIcon/>
				</ListItemIcon>
				<ListItemText primary={cred.name} />
				<ListItemSecondaryAction>
					<IconButton aria-label="Delete" onClick={() =>
						this.deleteCredentialFromLocal(cred, type)}>
						<DeleteIcon />
					</IconButton>
				</ListItemSecondaryAction>
				</ListItem>
			);
		}

	}

	getHistoryListComponentFromList(historyList){
		return historyList.map((uri) =>
			<ListItem button key={uri} onClick={() => {
				const url = new URL(uri);
				let portValue = url.port;
				if(url.port.length === 0){
					portValue = getDefaultPortFromUri(uri);
				}
				this.endpointCheckin(uri, portValue, {}, (error) => {
					this._handleError("Please enter your credential.");
					this.setState({url: uri, authFunction : this.regularSignIn, settingAuth: true, needPassword: true, portNum: portValue});
				})
			}}>
			  <ListItemIcon>
		        <DataIcon/>
		      </ListItemIcon>
	          <ListItemText primary={uri}/>
	          <ListItemSecondaryAction>
	            <IconButton aria-label="Delete" onClick={() => {
	            	deleteHistory(uri, (accept) => {
	            		this.historyListUpdateFromBackend();
	            	}, (error) => {
	            		this._handleError("Delete History Failed");
	            	});
	            }}>
	              <DeleteIcon />
	            </IconButton>
	          </ListItemSecondaryAction>
	        </ListItem>
		);
	}

	regularSignIn = () => {
	const {url, username, password, needPassword, rsa, pemFileName} = this.state;
	if(url.substr(url.length - 3) === '://') {
		this._handleError("Please enter a valid URL")
		return
	}
	// if(!needPassword){
	// 	this.endpointCheckin(this.state.url, this.state.portNum, {}, () => {
	// 		this.setState({needPassword: true});
	// 	});
	// }
	// else{
		// User is expected to enter password to login
		const loginType = getType(this.state.endpoint);
		if((username.length === 0 || password.length === 0)
			&& loginType !== showType.sftp) {
			this._handleError("Incorrect username or password");
			return;
		}

		if(loginType === showType.sftp){
			if((username.length === 0 || password.length === 0) && rsa.length === 0 && pemFileName.length === 0){
				this._handleError("Incorrect username or password");
				return;
			}
			else if((username.length !== 0 || password.length !== 0)){
				let jsEncrypt = new JSEncrypt();
				jsEncrypt.setPublicKey(ODS_PUBLIC_KEY);
				let encryptedPwd = jsEncrypt.encrypt(this.state.password);
			}
			else if( rsa.length !== 0){

			}
			else if(pemFileName.length !== 0){

			}
		}

		// Encrypting user password
		let jsEncrypt = new JSEncrypt();
		jsEncrypt.setPublicKey(ODS_PUBLIC_KEY);
		let encryptedPwd = jsEncrypt.encrypt(this.state.password);
		const credId = username+"@"+ url.toString();

		this.endpointCheckin(url,
			this.state.portNum,
			{type: "userinfo", credId: credId, name: username, password: password},
			() => {
			this._handleError("Authentication Failed");
			}
		);
		
	// }
	}

	globusSignIn = () => {
		const { needPassword } = this.state;
		
		if(!needPassword){
    		this.endpointCheckin(this.state.url, this.state.portNum, {}, () => {
    			this.setState({needPassword: true});
    		});
    	}else{
    		this.endpointCheckin(this.state.url, this.state.portNum,{type: "userinfo", username: this.state.username, password: this.state.password}, (msg) => {
    			this._handleError("Authentication Failed");
    		});
    	}
	}

	// Globus has deprecated singing in with username and password and instead recommends using globus url
    // globusActivateSignin = () => {
    // 	const {endpointSelected} = this.state;
	// 	this.props.setLoading(true);
	// 	globusEndpointActivate(endpointSelected, this.state.username,  this.state.password, (msg) => {
	// 		this.props.setLoading(false);
	// 		endpointSelected.activated = true;
	// 		this.endpointModalLogin(endpointSelected);
	// 	}, (error) => {
	// 		this.props.setLoading(false);
	// 		this._handleError("Authentication Failed");
	// 	});
	// }

	endpointModalAdd = (endpoint) => {
		this.props.setLoading(true);
		globusFetchEndpoints((data) => {
			this.setState({ endpointIdsList: data });
			this.endpointModalLogin(endpoint);
			this.props.setLoading(false);
		}, (error) => {
			this._handleError(error);
			this.props.setLoading(false);
		});
		
	};

	endpointModalLogin = (endpoint) => {
		if(endpoint.activated === "false"){
			eventEmitter.emit("messageOccured", "Please activate your globus endpoint using credential on the new tab");
			globusEndpointActivateWeb(endpoint.id);
			// this.setState({settingAuth: true, authFunction : this.globusActivateSignin, needPassword: true, endpointSelected: endpoint, selectingEndpoint: false});
		}else{
			this.setState({selectingEndpoint: false});
			this.endpointCheckin("gsiftp:///", this.state.portNum, {type: "globus", globusEndpoint: endpoint}, (msg) => {
				
    			this._handleError("Authentication Failed");
    		});
		}
	}

	handleClick = (e) => {
		this.inputElement.click();
	}

	nextButton = () => styled(Button)({
		width: "30%", textAlign: "center", marginLeft:"67%", marginBottom: "3%",
		["@media only screen and (max-width: 600px)"]:{
			width: "94%",
			marginLeft:"3%",
		}
	})

	// endpointModalClose = () => {this.setState({selectingEndpoint: false})}

	deleteConfirmationModal = () => {
		const handleClose = () => {
			this.setState({openModal: false});
		}
		const confirm = () => {
			// this.setState({deleteConfirm: true});

			handleClose();
		}
		const deny = () => {
			// this.setState({deleteConfirm: false});
			handleClose();
		}
		const savePref = () => {
			localStorage.setItem('hideConfirm', "true");
		}

		return(
			<Dialog
			open={this.state.openModal}
			onClose={handleClose}
			>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete this account from the list?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<FormControlLabel
						control={<CheckBox
							onChange={savePref}
							checked={Boolean(localStorage.getItem('hideConfirm'))}
						/>}
						label={"Don't show again"}
					/>
					<Button onClick={deny}>
						Cancel
					</Button>
					<Button onClick={confirm}>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		);
	}


	render(){
		const { historyList, endpoint, credList, settingAuth, authFunction, needPassword, endpointIdsList, selectingEndpoint } = this.state;
		const { back } = this.props;
		
		const type = getName(endpoint);
		const loginType = getType(endpoint);

		const endpointModalClose = () => {this.setState({selectingEndpoint: false})};
		const NextButton = this.nextButton();



		return(
		<div >
			{!settingAuth && <div className={"authenticationContainer"}>
				<Button style={{width: "100%", textAlign: "left"}} onClick={() =>{
					back()
				}}> <BackIcon/>Back</Button>
				<Divider/>

		        <ListItem id={endpoint.side+"Add"} button onClick={() => {
					if(isOAuth[loginType] && loginType !== showType.gsiftp){ //check if OAuth protocol
						OAuthFunctions[loginType]();
					}else if(loginType === showType.gsiftp){ //check if globus protocol
						this.setState({selectingEndpoint: true, authFunction : this.globusSignIn});
					}else{
						let loginUri = loginType;
						this.setState({settingAuth: true, authFunction : this.regularSignIn,
							needPassword: false, url: loginUri, portNum: getDefaultPortFromUri(loginUri)});
					}

		        }}>
		          <ListItemIcon>
		          	<AddIcon/>
		          </ListItemIcon>
		          <ListItemText primary={"Add New " + showDisplay[type].label} />
		        </ListItem>
		        <Divider />
				{/* Google Drive, Dropbox, Box login handler */}
				{(isOAuth[loginType] && loginType !== showType.gsiftp) && this.getCredentialListComponentFromList(credList, type)}
				{/* GridFTP OAuth handler */}
				{loginType === showType.gsiftp && this.getEndpointListComponentFromList(endpointIdsList)}
				{/* Other login handlers*/}
				{!isOAuth[loginType] &&
		        	this.getHistoryListComponentFromList(historyList)}
		    </div>}
	    	<Modal
	    	  aria-labelledby="simple-modal-title"
	          aria-describedby="To Select globus endpoints"
	          open={selectingEndpoint}
	          onClose={endpointModalClose}
	          style={{display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center"}}
	    	>
		    	<GlobusEndpointListingComponent close={endpointModalClose} endpointAdded={this.endpointModalAdd}/>
        	</Modal>
		    {settingAuth &&

		    	<div className={"authenticationContainer"}>
		    	<Button style={{width: "100%", textAlign: "left"}} onClick={() => {
		    		if(needPassword){
		    			this.setState({needPassword: false})
					}else{
						this.setState({settingAuth: false})}
					}

		    	}> <BackIcon/>Back</Button>
		    	<Divider />
					{
					<div style={{ paddingLeft: '3%', paddingRight: '3%' }}>

						<ValidatorForm
							ref="form"
							onError={errors => console.log(errors)}>

							<TextValidator
								required
								style={{width: "100%"}}
								id={endpoint.side+"LoginUsername"}
								label="Username"
								value={this.state.username}
								disabled={this.state.rsa}
								onChange={this.handleChange('username')}
								margin="normal"
								variant="outlined"
								autoFocus={(this.state.url !== 'sftp://') }
								onKeyPress={(e) => {
									if (e.key === 'Enter') {
										this.handleClick()
									}
								}}
							/>

							<TextValidator
								required
								style={{width: "100%"}}
								id={endpoint.side+"LoginPassword"}
								label="Password"
								type="password"
								disabled={this.state.rsa}
								value={this.state.password}
								onChange={this.handleChange('password')}
								margin="normal"
								variant="outlined"
								onKeyPress={(e) => {
									if (e.key === 'Enter') {
										this.handleClick()
									}
								}}
							/>

						</ValidatorForm>
					</div>
					}

					{
						loginType === showType.sftp && needPassword &&
							<React.Fragment>
								<Divider/>
								<div style={{ paddingLeft: '3%', paddingRight: '3%' }}>
									<ValidatorForm
										ref="form"
										onError={errors => console.log(errors)}>
										<TextValidator
											required
											style={{width: "100%"}}
											id={endpoint.side+"SFTP_RSA"}
											label="RSA Secret"
											value={this.state.rsa}
											disabled={this.state.username || this.state.password}
											onChange={this.handleChange('rsa')}
											margin="normal"
											variant="outlined"
											onKeyPress={(e) => {
												if (e.key === 'Enter') {
													this.handleClick()
												}
											}}
										/>
									</ValidatorForm>
								</div>
								<Divider/>
								<div style={{ paddingLeft: '3%', paddingRight: '3%', paddingTop: '3%', paddingBottom: '3%' }}>
									<Button
										variant={"contained"}
										component={"label"}
										disabled={this.state.username || this.state.password || this.state.rsa}
									>
										Upload PEM File
										<input
											type={"file"}
											accept={".pem"}
											style={{display: "none"}}
											onChange={(e)=>{
												const file = e.target.files[0];
												if(file.name.length > 0){
													this.setState({
														pemFile: file,
														pemFileName: file.name
													})
												}
											}}
										/>
									</Button>
								</div>
							</React.Fragment>

					}

		    	{loginType !== showType.gsiftp &&
		    		<div style={{ paddingLeft: '3%', paddingRight: '3%' }}>
							<ValidatorForm
								ref="form"
								onSubmit={authFunction}
								onError={errors => console.log(errors)}>

			    		<TextValidator
								required
					  		style={{width: "80%"}}
			          id={endpoint.side+"LoginURI"}
					  disabled = {needPassword}
			          label={"Url"}
			          value={this.state.url}
			          onChange={this.handleUrlChange}
			          margin="normal"
								InputProps={{
									disableUnderline: true
								}}
					  		variant="outlined"
					  		autoFocus={true}
					  		onKeyPress={(e) => {
									if (e.key === 'Enter') {
										// authFunction()
										this.handleClick()
						  		}
					  		}}
			        />

			        <TextValidator
								required
			    	  	style={{width: "20%", background: this.state.portNumField? "white" : "#D3D3D3"}}
					  		id={endpoint.side+"LoginPort"}
					  		disabled = {!this.state.portNumField || needPassword}
			          label={ "Port Num."}
			          value={this.state.portNumField? this.state.portNum : "-"}
			          onChange={this.handlePortNumChange}
			          margin="normal"
					  		variant="outlined"
					  		onKeyPress={(e) => {
								if (e.key === 'Enter') {
									this.handleClick()
									}
								}}
			        />
							</ValidatorForm>
			        </div>
		    	}	



					<NextButton
						id={endpoint.side + "LoginAuth"}
						ref={input => this.inputElement = input}
						// style={{width: "30%", textAlign: "center", marginLeft:"69%", marginBottom: "1%",
						// 	["@media only screen and (max-width: 500px)"]:{
						// 		width: "100%"
						// 	}
						// }}
						onClick={authFunction}
						color="primary"
						variant="contained">
						Next
					</NextButton>
		    	</div>

		    }
      	</div>);
	}
}
