/*
* Create new channel
*/
const fs = require('fs');
const path = require('path');
const utils = require('./utils.js');

const logger = utils.getLogger('create-channel.js');

let createChannel = async function (channelName, channelConfigPath, username, orgName) {
	logger.debug('\n====== Creating Channel \'' + channelName + '\' ======\n');
	try {
		// first setup the client for this org
		let client = await utils.getClientForOrg(orgName);
		logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

		// enable Client TLS
		let tlsInfo = await utils.tlsEnroll(client);
		client.setTlsClientCertAndKey(tlsInfo.certificate, tlsInfo.key);

		// read in the envelope for the channel config raw bytes
		let envelope = fs.readFileSync(path.join(__dirname, channelConfigPath));
		// extract the channel config bytes from the envelope to be signed
		let channelConfig = client.extractChannelConfig(envelope);
		let signature = client.signChannelConfig(channelConfig);

		let request = {
			config: channelConfig,
			signatures: [signature],
			name: channelName,
			txId: client.newTransactionID(true) // get an admin based transactionID
		};

		// send to orderer
		const result = await client.createChannel(request)
		logger.debug(' response ::%j', result);
		if (result) {
			if (result.status === 'SUCCESS') {
				logger.debug('Successfully created the channel.');
				const response = {
					success: true,
					message: 'Channel \'' + channelName + '\' created Successfully'
				};
				return response;
			} else {
				logger.error('Failed to create the channel. status:' + result.status + ' reason:' + result.info);
				const response = {
					success: false,
					message: 'Channel \'' + channelName + '\' failed to create status:' + result.status + ' reason:' + result.info
				};
				return response;
			}
		} else {
			logger.error(' Failed to create the channel ' + channelName);
			const response = {
				success: false,
				message: 'Failed to create the channel \'' + channelName + '\''
			};
			return response;
		}
	} catch (err) {
		logger.error('Failed to initialize the channel: ' + err.stack ? err.stack : err);
		throw new Error('Failed to initialize the channel: ' + err.toString());
	}
};

exports.createChannel = createChannel;
