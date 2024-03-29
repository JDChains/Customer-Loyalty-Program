let util = require('util');

let utils = require('./utils.js');
let logger = utils.getLogger('join-Channel.js');


// Join an organization to a channel
let joinChannel = async function (channel_name, peers, username, org_name) {
	logger.debug('\n\n============ Join Channel ============\n')
	let error_message = null;
	let all_eventhubs = [];
	try {
		logger.info('Calling peers in organization "%s" to join the channel', org_name);

		// first setup the client for this org
		let client = await utils.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);

		// enable Client TLS
		var tlsInfo = await utils.tlsEnroll(client);
		client.setTlsClientCertAndKey(tlsInfo.certificate, tlsInfo.key);

		let channel = client.getChannel(channel_name);
		if (!channel) {
			let message = util.format('Channel %s was not defined in the connection profile', channel_name);
			logger.error(message);
			throw new Error(message);
		}

		// next step is to get the genesis_block from the orderer,
		// the starting point for the channel that we want to join
		let request = {
			txId: client.newTransactionID(true) //get an admin based transactionID
		};
		let genesis_block = await channel.getGenesisBlock(request);

		// tell each peer to join and wait 10 seconds
		// for the channel to be created on each peer
		let promises = [];
		promises.push(new Promise(resolve => setTimeout(resolve, 10000)));

		let join_request = {
			targets: peers, //using the peer names which only is allowed when a connection profile is loaded
			txId: client.newTransactionID(true), //get an admin based transactionID
			block: genesis_block
		};
		let join_promise = channel.joinChannel(join_request);
		promises.push(join_promise);
		let results = await Promise.all(promises);
		logger.debug(util.format('Join Channel R E S P O N S E : %j', results));

		// lets check the results of sending to the peers which is
		// last in the results array
		let peers_results = results.pop();
		// then each peer results
		for (let i in peers_results) {
			let peer_result = peers_results[i];
			if (peer_result instanceof Error) {
				error_message = util.format('Failed to join peer to the channel with error :: %s', peer_result.toString());
				logger.error(error_message);
			} else if (peer_result.response && peer_result.response.status == 200) {
				logger.info('Successfully joined peer to the channel %s', channel_name);
			} else {
				error_message = util.format('Failed to join peer to the channel %s', channel_name);
				logger.error(error_message);
			}
		}
	} catch (error) {
		logger.error('Failed to join channel due to error: ' + error.stack ? error.stack : error);
		error_message = error.toString();
	}

	// need to shutdown open event streams
	all_eventhubs.forEach((eh) => {
		eh.disconnect();
	});

	if (!error_message) {
		let message = util.format(
			'Successfully joined peers in organization %s to the channel:%s',
			org_name, channel_name);
		logger.info(message);
		let response = {
			success: true,
			message: message
		};
		return response;
	} else {
		let message = util.format('Failed to join all peers to channel. cause:%s', error_message);
		logger.error(message);
		const response = {
			success: false,
			message: message
		};
		return response;
	}
};
exports.joinChannel = joinChannel;