'use strict';
let util = require('util');
let utils = require('./utils.js');
let logger = utils.getLogger('install-chaincode.js');


// Install a chaincode
let installChaincode = async function (peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, username, org_name) {
	logger.debug('\n\n============ Install chaincode on organizations ============\n');
	utils.setupChaincodeDeploy();
	let error_message = null;
	try {
		// first setup the client for this org
		let client = await utils.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);

		// enable Client TLS
		var tlsInfo = await utils.tlsEnroll(client);
		client.setTlsClientCertAndKey(tlsInfo.certificate, tlsInfo.key);

		let request = {
			targets: peers,
			chaincodePath: chaincodePath,
			chaincodeId: chaincodeName,
			chaincodeVersion: chaincodeVersion,
			chaincodeType: chaincodeType
		};
		let results = await client.installChaincode(request);
		let proposalResponses = results[0];
		let proposal = results[1];

		for (const i in proposalResponses) {
			if (proposalResponses[i] instanceof Error) {
				error_message = util.format('install proposal resulted in an error :: %s', proposalResponses[i].toString());
				logger.error(error_message);
			} else if (proposalResponses[i].response && proposalResponses[i].response.status === 200) {
				logger.info('install proposal was good');
			} else {
				all_good = false;
				error_message = util.format('install proposal was bad for an unknown reason %j', proposalResponses[i]);
				logger.error(error_message);
			}
		}
	} catch (error) {
		logger.error('Failed to install due to error: ' + error.stack ? error.stack : error);
		error_message = error.toString();
	}

	if (!error_message) {
		let message = util.format('Successfully installed chaincode');
		logger.info(message);
		const response = {
			success: true,
			message: message
		};
		return response;
	} else {
		let message = util.format('Failed to install due to:%s', error_message);
		logger.error(message);
		const response = {
			success: false,
			message: message
		};
		return response;
	}
};
exports.installChaincode = installChaincode;