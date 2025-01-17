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

import React, { Component } from "react";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import CardActions from "@material-ui/core/CardActions";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Button from "@material-ui/core/Button";
import PropTypes from "prop-types";
import {
  spaceBetweenStyle,
  validatePassword,
  validPassword,
} from "../../constants.js";
import {
  registerUser,
  verifyRegistraionCode,
  setPassword,
} from "../../APICalls/APICalls.js";
import LinearProgress from "@material-ui/core/LinearProgress";
import ValidateEmailComponent from "../Login/ValidateEmailComponent";
import PasswordRequirementsComponent from "../Login/PasswordRequirementsComponent";
import { Link } from "react-router-dom";

import { eventEmitter } from "../../App";
import ReCAPTCHA from "react-google-recaptcha";

import { ValidatorForm, TextValidator } from "react-material-ui-form-validator";

import { updateGAPageView } from "../../analytics/ga";

import VisibilityOutlinedIcon from "@material-ui/icons/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@material-ui/icons/VisibilityOffOutlined";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";

export default class CreateAccountComponent extends Component {
  static propTypes = {
    create: PropTypes.func,
    backToSignin: PropTypes.func,
  };
  constructor(props) {
    super(props);

    this.state = {
      email: props.email !== "" ? props.email : "",
      password: "",
      cpassword: "",
      code: "",
      screen: props.loadVerifyCode ? "verifyCode" : "registration",
      verificationError: "",
      passwordError: "",
      firstName: "",
      lastName: "",
      organization: "",
      loading: false,
      isLostVerifyCode: props.loadVerifyCode,
      emailError: false,
      firstNameError: false,
      lastNameError: false,
      emailErrorMessage: null,
      firstNameErrorMessage: null,
      lastNameErrorMessage: null,
      captchaVerified: false,
      captchaVerificationValue: null,
      confirmation: false,
      validations: validatePassword("", ""),
      canSubmit: false,
      isValidConfirmPassword: true,
      isValidNewPassword: true,
      passwordErrorMsg: "",
      isPwdVisible: false,
      isReEnterPwdVisible: false,
    };
    this.firstNameValidationMsg = "Please Enter Your First Name";
    this.lastNameValidationMsg = "Please Enter Your Last Name";
    this.emailValidationMsg = "Please Enter EmailId";
    this.captchaRef = null;

    this.registerAccount = this.registerAccount.bind(this);
    this.verifyAccount = this.verifyAccount.bind(this);
    this.login = this.login.bind(this);

    updateGAPageView();
    this.handleCaptchaEvent = this.handleCaptchaEvent.bind(this);
    this.resetCaptcha = this.resetCaptcha.bind(this);
    this.handleShowPassword = this.handleShowPassword.bind(this);
    this.handleHidePassword = this.handleHidePassword.bind(this);
  }


  registerAccount() {
    if (this.state.captchaVerified) {
      this.setState({ loading: true });
      let reqBody = {
        email: this.state.email,
        firstName: this.state.firstName,
        lastName: this.state.lastName,
        organization: this.state.organization,
        description: this.state.description,
        captchaVerificationValue: this.state.captchaVerificationValue,
      };

      registerUser(reqBody, () => {
        this.setState({ error: true, loading: false });
        eventEmitter.emit(
          "errorOccured",
          "Error occured while registering the user"
        );
      }).then((response) => {
        if (response.status === 200) {
          this.setState({
            screen: "verifyCode",
            verificationError: "",
            loading: false,
          });
        } else if (response.status === 302) {
          this.setState({
            emaildError: "User with same Email ID already exists",
            verificationError: "User with same Email ID already exists",
            loading: false,
          });
          eventEmitter.emit(
            "errorOccured",
            "User with same Email ID already exists"
          );
        }
        this.resetCaptcha();
      });
    } else {
      eventEmitter.emit("errorOccured", "Please verify you are not a robot!");
    }
  }

  verifyAccount() {
    let email = this.state.email;
    let self = this;
    let verificationCode = this.state.verificationCode;
    verifyRegistraionCode(email, verificationCode).then((response) => {
      let state = self.state;
      if (response.status === 200) {
        state.screen = "setPassword";
        state.code = response.data;
        self.setState({ state });
      } else {
        state.verificationError = "Please Enter Valid Verification Code";
        self.setState({ state });
      }
    });
  }

  login() {
    let email = this.state.email;
    let password = this.state.password;
    let confirmPassword = this.state.cpassword;
    let code = this.state.code;

    setPassword(email, code, password, confirmPassword).then((response) => {
      this.props.backToSignin();
    });
  }

  handleCaptchaEvent(value) {
    this.setState({ captchaVerified: true, captchaVerificationValue: value });
  }

  resetCaptcha() {
    if (this.captchaRef !== null) {
      this.setState({ captchaVerified: false, captchaVerificationValue: null });
      this.captchaRef.reset();
    }
  }

  checkIfUserCanSubmit() {
    let unsatisfiedRequirements = this.state.validations.filter(function(
      criteria
    ) {
      return criteria.containsError;
    }).length;
    if (unsatisfiedRequirements > 0) {
      this.setState({ canSubmit: false });
    } else {
      this.setState({ canSubmit: true });
    }
  }

  handleShowPassword(field) {
    switch (field) {
      case "enter":
        this.setState({ isPwdVisible: true });
        break;
      case "reenter":
        this.setState({ isReEnterPwdVisible: true });
        break;
      default:
        break;
    }
  }

  handleHidePassword() {
    this.setState({ isPwdVisible: false, isReEnterPwdVisible: false });
  }

  render() {
    const {
      emailError,
      emailErrorMessage,
      email,
      firstNameError,
      firstNameErrorMessage,
      lastNameError,
      lastNameErrorMessage,
      confirmation,
    } = this.state;
    const disclaimer = (
      <div style={{ fontSize: "12px" }}>
        By checking the box,you agree to the{" "}
        <Link to="/terms" target="_blank">
          Terms of service
        </Link>{" "}
        and{" "}
        <Link to="/policy" target="_blank">
          Privacy policy
        </Link>
        .
      </div>
    );
    const properties = this.props;
    const divStyle = { margin: "2% 5%" };
    const captchaStyle = {
      ...divStyle,
      textAlign: "center",
      display: "inline-block",
    };
    var screen = this.state.screen;
    const showLoader = this.state.loading;
    console.log(process.env);

    const handleChange = (name) => (event) => {
      this.setState({
        emailError: false,
        emailErrorMessage: null,
        [name]: event.target.value,
      });
    };

    const checkPassword = (name) => (event) => {
      if (name === "password") {
        const validObj = validPassword(
          "newPassword",
          event.target.value,
          this.state.password
        );
        this.setState({
          [name]: event.target.value,
          isValidNewPassword: validObj.isValid,
          passwordErrorMsg: validObj.errormsg,
        });
      } else if (name === "cpassword") {
        const validObj = validPassword(
          "confirmNewPassword",
          this.state.password,
          event.target.value
        );
        this.setState({
          [name]: event.target.value,
          isValidConfirmPassword: validObj.isValid,
          passwordErrorMsg: validObj.errormsg,
        });
      }
    };

    if (screen === "validateEmail") {
      return (
        <div className="enter-from-right slide-in">
          <ValidateEmailComponent
            {...properties}
            email={this.state.email}
          ></ValidateEmailComponent>
        </div>
      );
    }

    if (screen === "registration") {
      const textBoxStyle = { width: "100%", marginBottom: "4%" };
      return (
        <div className="enter-from-right slide-in">
          <div>{showLoader && <LinearProgress></LinearProgress>}</div>
          <Typography
            style={{
              fontSize: "1.6em",
              marginBottom: "0.4em",
              textAlign: "center",
            }}
          >
            Create Your OneDataShare Account
          </Typography>

          <ValidatorForm ref="email" onSubmit={this.registerAccount}>
            <TextValidator
              error={emailError}
              helperText={emailErrorMessage}
              label="Email"
              onChange={handleChange("email")}
              name="email"
              value={email}
              validators={["required", "isEmail"]}
              errorMessages={[
                "Please enter your email address",
                "Can not understand email format",
              ]}
              style={textBoxStyle}
              InputProps={{
                style: { fontSize: 14 },
              }}
            />

            <TextValidator
              error={firstNameError}
              helperText={firstNameErrorMessage}
              label="FirstName"
              name="firstName"
              value={this.state.firstName}
              id="FirstName"
              validators={["required"]}
              errorMessages={["Please Enter Your First Name"]}
              style={textBoxStyle}
              onChange={handleChange("firstName")}
              InputProps={{
                style: { fontSize: 14 },
              }}
            />

            <TextValidator
              error={lastNameError}
              helperText={lastNameErrorMessage}
              label="LastName"
              name="lastName"
              value={this.state.lastName}
              id="LastName"
              validators={["required"]}
              errorMessages={["Please Enter Your Last Name"]}
              style={textBoxStyle}
              onChange={handleChange("lastName")}
              InputProps={{
                style: { fontSize: 14 },
              }}
            />

            <TextField
              id="Organization"
              label={"Organization"}
              value={this.state.organization}
              style={textBoxStyle}
              onChange={handleChange("organization")}
              InputProps={{
                style: { fontSize: 14 },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmation}
                  value={"ok"}
                  onChange={(event) => {
                    this.setState({ confirmation: !confirmation });
                  }}
                  color="primary"
                />
              }
              label={disclaimer}
            />

            <div style={captchaStyle}>
              <ReCAPTCHA
                sitekey={process.env.REACT_APP_GC_CLIENT_KEY}
                onChange={this.handleCaptchaEvent}
                ref={(r) => (this.captchaRef = r)}
              />
            </div>

            <CardActions style={{ ...spaceBetweenStyle, float: "center" }}>
              <Link to="/account/signIn">
                <Button size="medium" variant="outlined" color="primary">
                  Sign In
                </Button>
              </Link>

              <Button
                size="medium"
                variant="contained"
                color="primary"
                disabled={!confirmation}
                style={{ marginLeft: "4vw" }}
                type="submit"
              >
                Next
              </Button>
            </CardActions>
          </ValidatorForm>
        </div>
      );
    }

    if (screen === "verifyCode") {
      return (
        <div className="enter-from-right slide-in">
          <Typography
            style={{
              fontSize: "1.1em",
              margin: "2%",
              overflowWrap: "break-word",
            }}
          >
            Please check {this.state.email} for authorization code
          </Typography>
          <TextField
            id="code"
            label={
              this.state.verificationError === ""
                ? "Enter Verification Code"
                : "Please Enter Valid Verification Code"
            }
            value={this.state.verificationCode}
            style={{ width: "100%", marginBottom: "50px" }}
            onChange={handleChange("verificationCode")}
            error={
              this.state.verificationError ===
              "Please Enter Valid Verification Code"
            }
            InputProps={{
              style: { fontSize: 14 },
            }}
          />

          <CardActions style={{ ...spaceBetweenStyle }}>
            <Button
              size="medium"
              variant="outlined"
              color="primary"
              onClick={() => {
                if (this.state.isLostVerifyCode) {
                  this.setState({ screen: "validateEmail" });
                } else {
                  this.setState({ screen: "registration" });
                }
              }}
            >
              Back
            </Button>
            <Button
              size="large"
              variant="contained"
              color="primary"
              type="submit"
              style={{ marginLeft: "4vw" }}
              onClick={this.verifyAccount}
            >
              Next
            </Button>
          </CardActions>
        </div>
      );
    }

    if (screen === "setPassword") {
      return (
        <div className="enter-from-right slide-in">
          <Typography style={{ fontSize: "1.6em", marginBottom: "0.4em" }}>
            Code Verified! Please set password for your account
          </Typography>

          <TextField
            id="Password"
            label="Password"
            type={this.state.isPwdVisible ? "text" : "password"}
            value={this.state.password}
            error={!this.state.isValidNewPassword}
            style={{ width: "100%", marginBottom: "30px" }}
            onChange={checkPassword("password")}
            InputProps={{
              style: { fontSize: 14 },
              endAdornment: (
                <React.Fragment>
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onMouseDown={() => this.handleShowPassword("enter")}
                      onMouseUp={this.handleHidePassword}
                    >
                      {this.state.isPwdVisible ? (
                        <VisibilityOutlinedIcon />
                      ) : (
                        <VisibilityOffOutlinedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                </React.Fragment>
              ),
            }}
          />
          <TextField
            id="Cpassword"
            type={this.state.isReEnterPwdVisible ? "text" : "password"}
            label={"Confirm Password"}
            value={this.state.cpassword}
            style={{ width: "100%", marginBottom: "30px" }}
            onChange={checkPassword("cpassword")}
            error={!this.state.isValidConfirmPassword}
            InputProps={{
              style: { fontSize: 14 },
              endAdornment: (
                <React.Fragment>
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onMouseDown={() => this.handleShowPassword("reenter")}
                      onMouseUp={this.handleHidePassword}
                    >
                      {this.state.isReEnterPwdVisible ? (
                        <VisibilityOutlinedIcon />
                      ) : (
                        <VisibilityOffOutlinedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                </React.Fragment>
              ),
            }}
          />
          <PasswordRequirementsComponent
            showList={
              !this.state.isValidNewPassword ||
              !this.state.isValidConfirmPassword
            }
            errorMsg={this.state.passwordErrorMsg}
          />
          <CardActions style={{ ...spaceBetweenStyle, float: "center" }}>
            <Button
              size="medium"
              variant="outlined"
              color="primary"
              onClick={() => {
                this.setState({ screen: "verifyCode" });
              }}
            >
              Back
            </Button>
            <Button
              size="large"
              variant="contained"
              color="primary"
              style={{ marginLeft: "4vw" }}
              onClick={this.login}
              disabled={
                !(
                  this.state.isValidNewPassword &&
                  this.state.isValidConfirmPassword &&
                  this.state.password &&
                  this.state.cpassword
                )
              }
            >
              Next
            </Button>
          </CardActions>
        </div>
      );
    }
  }
}
