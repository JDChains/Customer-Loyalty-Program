'use strict';
const path = require('path');
const util = require('util');
const fabricCaClient = require('fabric-ca-client');
const hfc = require('fabric-client');
const log4js = require('log4js');
const invoke=require('./invoke-transaction');

let logger = log4js.getLogger('utils.js:');
log4js.configure({
	appenders: {
		allLogs: {
			type: 'file',
			filename: 'logs/all_log.log'
		},
		specialLogs: {
			type: 'file',
			filename: 'logs/special_log.log'
		},
		console: {
			type: 'console'
		}
	},
	categories: {
		write: {
			appenders: ['specialLogs'],
			level: 'info'
		},
		default: {
			appenders: ['console', 'allLogs'],
			level: 'trace'
		}
	}
});
hfc.setLogger(logger);

// Get a client for the ORG
async function getClientForOrg(userorg, username) {
	try {
		logger.debug('getClientForOrg - %s %s', userorg, username)
		// get a fabric client loaded with a connection profile for this org
		let config = '-connection-profile';

		let client = hfc.loadFromConfig(hfc.getConfigSetting('network' + config));
		client.loadFromConfig(hfc.getConfigSetting(userorg + config));

		await client.initCredentialStores();

		if (username) {
			let user = await client.getUserContext(username, true);
			if (!user) {
				throw new Error(util.format('User was not found username:', username));
			} else {
				logger.debug('User %s was found to be registered and enrolled', username);
			}
		}
		logger.debug('getClientForOrg - ****** END %s %s \n\n', userorg, username)

		return client;
	}
	catch (e) {
		throw new Error(e);
	}
}

// Get a User Identity
async function getUserIdentity(userOrg, username) {
	try {
		let client = await getClientForOrg(userOrg);
		logger.debug('Successfully initialized the credential stores');
		// client can now act as an agent for organization Org1
		// first check to see if the user is already enrolled
		let user = await client.getUserContext(username, true);
		if (user && user.isEnrolled()) {
			let caClient = client.getCertificateAuthority();
			let admins = caClient.getRegistrar();
			// user was not enrolled, so we will need an admin user object to register
			let adminUserObj = await client.setUserContext({
				username: admins[0].enrollId,
				password: admins[0].enrollSecret
			});
			let fabricCAEndpoint = caClient.getUrl();
			let tlsOptions = {
				trustedRoots: [],
				verify: false
			};
			let caname = caClient.getName();
			const caService = new fabricCaClient(fabricCAEndpoint, tlsOptions, caname);
			let newIdentity = await caService.newIdentityService();
			let userIdentity = await newIdentity.getOne(username, adminUserObj);
			console.log(userIdentity);
			return userIdentity.result;
		} else {
			throw new Error('User was not enrolled ');
		}
	} catch (error) {
		logger.error('Failed to get registered user: %s with error: %s', username, error.toString());
		throw new Error(error.toString());
	}
}

// Enroll a new user to the specified ORG
let enrollInitUser = async function (username, userOrg, isJson) {
	try {
		let client = await getClientForOrg(userOrg);
		logger.debug('Successfully initialized the credential stores');
		// client can now act as an agent for organization Org1
		// first check to see if the user is already enrolled
		let user = await client.getUserContext(username, true);
		if (user && user.isEnrolled()) {
			logger.info('Successfully loaded member from persistence');
		} else {
			let caClient = client.getCertificateAuthority();
			let admins = caClient.getRegistrar();
			// user was not enrolled, so we will need an admin user object to register
			let adminUserObj = await client.setUserContext({
				username: admins[0].enrollId,
				password: admins[0].enrollSecret
			});
			let secret = await caClient.register({
				enrollmentID: username,
				role: 'client',
				affiliation: userOrg.toLowerCase() + '.department1'
			}, adminUserObj);
			user = await client.setUserContext({
				username: username,
				password: secret
			});
			logger.debug('Successfully enrolled username %s  and setUserContext on the client object', username);
		}
		let userid = await getUserIdentity(userOrg, username);
		console.log('User Identity' + userid);
		if (user && user.isEnrolled) {
			if (isJson && isJson === true) {
				let response = {
					success: true,
					secret: user._enrollmentSecret,
					message: username + ' Enrolled Successfully',
				};
				return response;
			}
		} else {
			throw new Error('User was not enrolled ');
		}
	} catch (error) {
		logger.error('Failed to get registered user: %s with error: %s', username, error.toString());
		throw new Error(error.toString());
	}
};

// Update Password
let updatePassword = async function (username, secret, userOrg, isJson) {
	try {
		let client = await getClientForOrg(userOrg);
		let caClient = client.getCertificateAuthority();

		let admins = caClient.getRegistrar();
		let adminUser = await client.setUserContext({ username: admins[0].enrollId, password: admins[0].enrollSecret });
		try {
			let identityService = caClient.newIdentityService();
			identityService.update(username, {
				enrollmentSecret: secret
			}, adminUser);
		}
		catch (error) {
			logger.error('Failed to get update password for user: "%s" with error: "%s"', username, error.toString());
			throw new Error(error.toString());
		}

		if (isJson && isJson === true) {
			let response = {
				success: true,
				username: username,
				password: secret
			};
			return response;
		}
	} catch (error) {
		logger.error('Failed to update password for user: "%s" with error: "%s"', username, error.toString());
		throw new Error(error.toString());
	}
}

// Revoke User
let revokeUser = async function (username, userOrg, isJson) {
	try {
		let client = await getClientForOrg(userOrg);
		logger.debug('Successfully initialized the credential stores');
		// client can now act as an agent for organization Org1
		// first check to see if the user is already enrolled
		let user = await client.getUserContext(username, true);
		if (user && user.isEnrolled()) {
			logger.info('Successfully loaded member from persistence');
			let caClient = client.getCertificateAuthority();
			let admins = caClient.getRegistrar();
			// user was not enrolled, so we will need an admin user object to register
			let adminUserObj = await client.setUserContext({
				username: admins[0].enrollId,
				password: admins[0].enrollSecret
			});
			let crl = await caClient.revoke({ enrollmentID: username }, adminUserObj);
			let genCrl = await caClient.generateCRL({}, adminUserObj);
			logger.debug(genCrl);
			return genCrl;
		}
		else {
			logger.error('Failed to get registered user: %s !!! First register the user : ' + username);
		}
	} catch (error) {
		logger.error('Failed to get registered user: %s with error: %s', username, error.toString());
		throw new Error(error.toString());
	}
};

// Get Registered user
let getRegisteredUser = async function (username, userOrg, isJson) {
	try {
		let client = await getClientForOrg(userOrg);
		logger.debug('Successfully initialized the credential stores');
		// client can now act as an agent for organization Org1
		// first check to see if the user is already enrolled

		let user = await client.getUserContext(username, true);
		if (user && user.isEnrolled()) {
			logger.info('Successfully loaded member from persistence');
		} else {
			throw new Error('Not a valid user');
		}
		if (user && user.isEnrolled) {
			if (isJson && isJson === true) {
				let response = {
					success: true,
					secret: user._enrollmentSecret,
					message: username + ' Enrolled Successfully',
				};
				return response;
			}
		} else {
			throw new Error('User was not enrolled ');
		}
	} catch (error) {
		logger.error('Failed to get registered user: %s with error: %s', username, error.toString());
		throw new Error(error);
	}

};

//TLS Enroll
async function tlsEnroll(client) {
	let caClient = client.getCertificateAuthority();
	let admins = caClient.getRegistrar();
	let req = {
		enrollmentID: admins[0].enrollId,
		enrollmentSecret: admins[0].enrollSecret,
		profile: 'tls'
	};
	let enrollment = await caClient.enroll(req);
	enrollment.key = enrollment.key.toBytes();
	return enrollment;
}

let setupChaincodeDeploy = function () {
	process.env.GOPATH = path.join(__dirname, hfc.getConfigSetting('CC_SRC_PATH'));
};

let getLogger = function (moduleName) {
	let logger = log4js.getLogger(moduleName);
	return logger;
};

// Create new affiliation 
let createNewAffiliation = async function (orgName, affiliation) {
	try {
		let client = await getClientForOrg(orgName);
		console.log("******************************" + client);
		let tlsOptions = {
			trustedRoots: [],
			verify: false
		};
		let caClient = client.getCertificateAuthority();
		let admins = caClient.getRegistrar();
		// user was not enrolled, so we will need an admin user object to register
		let adminUserObj = await client.setUserContext({
			username: admins[0].enrollId,
			password: admins[0].enrollSecret
		});
		let org = orgName.toLowerCase();
		let affiliationName = org + '.' + affiliation.toLowerCase();
		logger.info('New affiliation :' + affiliationName);
		let fabricCAEndpoint = caClient.getUrl();

		let caname = caClient.getName();
		const caService = new fabricCaClient(fabricCAEndpoint, tlsOptions, caname);
		const affiliationRequest = {
			name: affiliationName,
			force: true,
		};
		let affiliationService = await caService.newAffiliationService();
		let newAffiliation = await affiliationService.create(affiliationRequest, adminUserObj);
		return newAffiliation;
	}
	catch (err) {
		throw new Error(err);
	}
};
//register new user
//let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, adminusername, orgName);
let registerNewUser = async function(peers, channelName, chaincodeName, fcn, args, orgName, isJson) {
	console.log('==================== HELPER.......REGISTER ==================');
	console.log(peers);
	console.log(channelName);
	console.log(chaincodeName);
	console.log(fcn);
	console.log(args);
	console.log(orgName);
	console.log(isJson);

	var username=args[0];
	try {
		var client = await getClientForOrg(orgName);
		console.log('Successfully initialized the credential stores');
			// client can now act as an agent for organization Org1
			// first check to see if the user is already enrolled
		var user = await client.getUserContext(username, true);
		if (user && user.isEnrolled()) {
			throw new Error('User already Registered ');
		} else {
			// user was not enrolled, so we will need an admin user object to register
			console.log('User %s was not enrolled, so we will need an admin user object to register',username);
			
			let caClient = client.getCertificateAuthority();
			let admins = caClient.getRegistrar();
			let adminusername =admins[0].enrollId;
			let adminUserObj = await client.setUserContext({
				username: admins[0].enrollId,
				password: admins[0].enrollSecret
			});

			let secret = await caClient.register({
				enrollmentID: username,
				role: 'client',
				affiliation: orgName.toLowerCase() + '.department1'
			}, adminUserObj);
			user = await client.setUserContext({
				username: username,
				password: secret
			});
			console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")

			try{
				console.log("$$$$$$$$$$$dddddddddddddddddddddddddd$$$$$$$$$$")

			let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, adminusername, orgName);
			console.log(message);
			console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
			console.log('Successfully enrolled username %s  and setUserContext on the client object', username);
			let caClient = client.getCertificateAuthority();
			let secret = await caClient.register({
				enrollmentID: username,
				affiliation: orgName.toLowerCase() + '.department1'
			}, adminUserObj);
			console.log('Successfully got the secret for user %s',username);
			user = await client.setUserContext({username:username, password:secret});	
		}
			catch(error){
				var response = {
					success: false,
					secret: "",
					message: error.toString() ,
					error: error.toString(),
				};
			}
		
		}
		if(user && user.isEnrolled) {
			if (isJson && isJson === true) {
				var response = {
					success: true,
					secret: "",
					message: ' Registered Successfully',
				};
				
				return response;
			}
		} else {
			if (isJson && isJson === true) {
				var response = {
					success: false,
					secret: "",
					message: ' Registration failed',
				};
				
				return response;
		}
		}
	} catch(error) {
		if (isJson && isJson === true) {
			var response = {
				success: false,
				secret: "",
				message: error.toString() ,
				error: error.toString(),
			};
			return response;
}
	}

};

exports.getClientForOrg = getClientForOrg;
exports.registerNewUser = registerNewUser;
exports.getUserIdentity = getUserIdentity;
exports.enrollInitUser = enrollInitUser;
exports.updatePassword = updatePassword;
exports.revokeUser = revokeUser;
exports.getRegisteredUser = getRegisteredUser;
exports.tlsEnroll = tlsEnroll;
exports.setupChaincodeDeploy = setupChaincodeDeploy;
exports.getLogger = getLogger;
exports.createNewAffiliation = createNewAffiliation;
