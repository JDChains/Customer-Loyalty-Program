'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const expressJWT = require('express-jwt')
const jwt = require('jsonwebtoken')
const bearerToken = require('express-bearer-token')
const cookieParser = require('cookie-parser')
const cors = require('cors')
require('./config.js')
let hfc = require('fabric-client')
let fs = require('fs')



let utils = require('./app/utils.js')
let createChannel = require('./app/create-channel.js')
let join = require('./app/join-channel.js')
let install = require('./app/install-chaincode.js')
let upgrade=require('./app/upgrade-chaincode.js')
let instantiate = require('./app/instantiate-chaincode.js')
let invoke = require('./app/invoke-transaction.js')
let query = require('./app/query.js')
let updateAnchorPeers = require('./app/update-anchor-peers.js')
let host = process.env.HOST || hfc.getConfigSetting('host')
let port = process.env.PORT || hfc.getConfigSetting('port')
let log4js = require('log4js')
let util = require('util')
let logger = utils.getLogger('app.js')

const app = express()

// Endpoints Starts from here

// middleware config
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.options('*', cors())
app.use(cors())

const baseurl = '/api'
// set secret variable
const secret = 'JeaDigitalSecret'
app.set('secret', secret)
app.use(
  expressJWT({
    secret: secret
  }).unless({
    path: [
      baseurl + '/register',
      baseurl + '/login',
      baseurl + '/register_customer',
      baseurl + '/admin_login',
      baseurl + '/auth_user',
      baseurl + '/newAffiliation',
      baseurl + '/newAffiliation',
      baseurl + '/register_company'    
    ]
  })
)
app.use(bearerToken())
app.use(function (err, req, res, next) {
  console.log('Error:' + err)
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({
      success: false,
      status: 401,
      message: 'Invalid Token'
    })
  }
})
app.use(function (req, res, next) {
  logger.info(' New request for %s', req.originalUrl)
  if (req.originalUrl.indexOf(baseurl + '/register') >= 0) {
    return next()
  }
  if (req.originalUrl.indexOf(baseurl + '/login') >= 0) {
    return next()
  }
  if (req.originalUrl.indexOf(baseurl + '/register_company') >= 0) {
    return next()
  }
  if (req.originalUrl.indexOf(baseurl + '/register_customer') >= 0) {
    return next()
  }
  
  
  if (req.originalUrl.indexOf(baseurl + '/admin_login') >= 0) {
    return next()
  }
  if (req.originalUrl.indexOf(baseurl + '/auth_user') >= 0) {
    return next()
  }
  if (req.originalUrl.indexOf(baseurl + '/newAffiliation') >= 0) {
    return next()
  }
  
	

  let token = req.token
  jwt.verify(token, app.get('secret'), function (err, decoded) {
    if (err) {
      res.send({
        success: false,
        status: 401,
        message: 'Failed to authenticate token'
      })
    } else {
      req.username = decoded.username
      req.orgname = decoded.orgName
      req.role = decoded.role
      logger.info(
        util.format(
          'Decoded from JWT token: username - %s, orgname - %s, role - %s',
          decoded.username,
          decoded.orgName,
          decoded.role
        )
      )
      return next()
    }
  })
})

// **********************************************************************************
// **********************************************************************************

// Sever starting
app.listen(port, () => console.log('App listening on port ' + port))

// **********************************************************************************
// ************************BLOCKCHAIN SETUP ENDPOINTS********************************
// **********************************************************************************

function getErrorMessage (field) {
  let response = {
    success: false,
    message: field + ' field is missing or Invalid in the request'
  }
  return response
}

// Register and enroll user
app.post(baseurl + '/auth_user', async function (req, res) {
  try {
    let username = req.body.username
    let orgName = req.body.orgName
    if (!username) {
      res.json(getErrorMessage("'username'"))
      return
    }
    if (!orgName) {
      res.json(getErrorMessage("'orgName'"))
      return
    }
    let token = jwt.sign(
      {
        exp:
          Math.floor(Date.now() / 1000) +
          parseInt(hfc.getConfigSetting('jwt_expiretime')),
        username: username,
        orgName: orgName
      },
      app.get('secret')
    )
    let response = await utils.enrollInitUser(username, orgName, true)
    if (response && typeof response !== 'string') {
      logger.debug(
        'Successfully registered the username %s for organization %s',
        username,
        orgName
      )
      response.token = token
      res.json(response)
    } else {
      logger.debug(
        'Failed to register the username %s for organization %s with::%s',
        username,
        orgName,
        response
      )
      res.json({
        success: false,
        message: response
      })
    }
  } catch (e) {
    res.json({
      success: false,
      message: e.toString()
    })
  }
})

// Create Channel
app.post(baseurl + '/create_channels', async function (req, res) {
  logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>')
  logger.debug('End point : /api/v1/create_channels')
  let channelName = req.body.channelName
  let channelConfigPath = req.body.channelConfigPath
  logger.debug('Channel name : ' + channelName)
  logger.debug('channelConfigPath : ' + channelConfigPath) // ../artifacts/channel/mychannel.tx
  if (!channelName) {
    res.json(getErrorMessage("'channelName'"))
    return
  }
  if (!channelConfigPath) {
    res.json(getErrorMessage("'channelConfigPath'"))
    return
  }

  let message = await createChannel.createChannel(
    channelName,
    channelConfigPath,
    req.username,
    req.orgname
  )
  res.send(message)
})
// Join Channel
app.post(baseurl + '/join_channels/:channelName/peers', async function (
  req,
  res
) {
  logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>')
  let channelName = req.params.channelName
  let peers = req.body.peers
  logger.debug('channelName : ' + channelName)
  logger.debug('peers : ' + peers)
  logger.debug('username :' + req.username)
  logger.debug('orgname:' + req.orgname)

  if (!channelName) {
    res.json(getErrorMessage("'channelName'"))
    return
  }
  if (!peers || peers.length == 0) {
    res.json(getErrorMessage("'peers'"))
    return
  }

  let message = await join.joinChannel(
    channelName,
    peers,
    req.username,
    req.orgname
  )
  res.send(message)
})
// Update anchor peers
app.post(baseurl+'/channels/:channelName/anchorpeers', async function (req, res) {
  logger.debug('==================== UPDATE ANCHOR PEERS ==================')
  let channelName = req.params.channelName
  let configUpdatePath = req.body.configUpdatePath
  logger.debug('Channel name : ' + channelName)
  logger.debug('configUpdatePath : ' + configUpdatePath)
  if (!channelName) {
    res.json(getErrorMessage("'channelName'"))
    return
  }
  if (!configUpdatePath) {
    res.json(getErrorMessage("'configUpdatePath'"))
    return
  }

  let message = await updateAnchorPeers.updateAnchorPeers(
    channelName,
    configUpdatePath,
    req.username,
    req.orgname
  )
  res.send(message)
})
// Install chaincode on target peers
app.post(baseurl + '/install_chaincodes', async function (req, res) {
  logger.debug('==================== INSTALL CHAINCODE ==================')
  let peers = req.body.peers
  let chaincodeName = req.body.chaincodeName
  let chaincodePath = req.body.chaincodePath
  let chaincodeVersion = req.body.chaincodeVersion
  let chaincodeType = req.body.chaincodeType
  logger.debug('peers : ' + peers) // target peers list
  logger.debug('chaincodeName : ' + chaincodeName)
  logger.debug('chaincodePath  : ' + chaincodePath)
  logger.debug('chaincodeVersion  : ' + chaincodeVersion)
  logger.debug('chaincodeType  : ' + chaincodeType)
  if (!peers || peers.length == 0) {
    res.json(getErrorMessage("'peers'"))
    return
  }
  if (!chaincodeName) {
    res.json(getErrorMessage("'chaincodeName'"))
    return
  }
  if (!chaincodePath) {
    res.json(getErrorMessage("'chaincodePath'"))
    return
  }
  if (!chaincodeVersion) {
    res.json(getErrorMessage("'chaincodeVersion'"))
    return
  }
  if (!chaincodeType) {
    res.json(getErrorMessage("'chaincodeType'"))
    return
  }
  let message = await install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.username, req.orgname)
  res.send(message)
})

// Instantiate chaincode on target peers
app.post(baseurl + '/instantiate_chaincode/:channelName/chaincodes',async function (req, res) {
    logger.debug(
      '==================== INSTANTIATE CHAINCODE =================='
    )
    let peers = req.body.peers
    let chaincodeName = req.body.chaincodeName
    let chaincodeVersion = req.body.chaincodeVersion
    let channelName = req.params.channelName
    let chaincodeType = req.body.chaincodeType
    let fcn = req.body.fcn
    let args = req.body.args
    logger.debug('peers  : ' + peers)
    logger.debug('channelName  : ' + channelName)
    logger.debug('chaincodeName : ' + chaincodeName)
    logger.debug('chaincodeVersion  : ' + chaincodeVersion)
    logger.debug('chaincodeType  : ' + chaincodeType)
    logger.debug('fcn  : ' + fcn)
    logger.debug('args  : ' + args)
    if (!chaincodeName) {
      res.json(getErrorMessage("'chaincodeName'"))
      return
    }
    if (!chaincodeVersion) {
      res.json(getErrorMessage("'chaincodeVersion'"))
      return
    }
    if (!channelName) {
      res.json(getErrorMessage("'channelName'"))
      return
    }
    if (!chaincodeType) {
      res.json(getErrorMessage("'chaincodeType'"))
      return
    }
    if (!args) {
      res.json(getErrorMessage("'args'"))
      return
    }

    let message = await instantiate.instantiateChaincode(
      peers,
      channelName,
      chaincodeName,
      chaincodeVersion,
      chaincodeType,
      fcn,
      args,
      req.username,
      req.orgname
    )
    res.send(message)
  }
)

// Upgrade chaincode on target peers
app.post(baseurl + '/upgrade_chaincode/:channelName/chaincodes', async function (req,
res
) {
  logger.debug('==================== UPGRADE CHAINCODE ==================')
  let peers = req.body.peers
  let chaincodeName = req.body.chaincodeName
  let chaincodeVersion = req.body.chaincodeVersion
  let channelName = req.params.channelName
  let chaincodeType = req.body.chaincodeType
  let fcn = req.body.fcn
  let chaincodePath = req.body.chaincodePath
  let args = req.body.args
  logger.debug('peers  : ' + peers)
  logger.debug('channelName  : ' + channelName)
  logger.debug('chaincodeName : ' + chaincodeName)
  logger.debug('chaincodeVersion  : ' + chaincodeVersion)
  logger.debug('chaincodeType  : ' + chaincodeType)
  logger.debug('fcn  : ' + fcn)
  logger.debug('args  : ' + args)
  if (!chaincodeName) {
    res.json(getErrorMessage("'chaincodeName'"))
    return
  }
  if (!chaincodeVersion) {
    res.json(getErrorMessage("'chaincodeVersion'"))
    return
  }
  if (!channelName) {
    res.json(getErrorMessage("'channelName'"))
    return
  }
  if (!chaincodeType) {
    res.json(getErrorMessage("'chaincodeType'"))
    return
  }
  if (!args) {
    res.json(getErrorMessage("'args'"))
    return
  }

  let message = await upgrade.upgradeChaincode(
    peers,
    channelName,
    chaincodeName,
    chaincodeVersion,
    fcn,
    chaincodeType,
    args,
    req.username,
    req.orgname
  )
  res.send(message)
})

app.post(baseurl + '/newAffiliation', async function (req, res) {
  logger.debug('***/newAffiliation***')
  let orgName = req.body.orgName
  let affliation = req.body.affliation
  try {
    let message = await utils.createNewAffiliation(orgName, affliation)
    logger.debug(message)
    res.send(message)
  } catch (e) {
    let response = e.toString()
    logger.info(response)
    res.send(response)
  }
})

// *****************************BlockChain System Query Endpoints*****************************

// Query for Channel Information
app.get(baseurl + '/jeabc-channel/info', async function (req, res) {
  console.log(
    '================ QUERY CHANNEL INFORMATION ======================'
  )
  let peer = 'peer0.customer.jeabc.com'
  let channelName = 'jeabc-channel'
  let message = await query.getChainInfo(
    peer,
    channelName,
    req.username,
    req.orgname
  )
  res.send(message)
})

//  Query Block by BlockNumber
app.get(baseurl + '/jeabc-channel/block_info/:blockId', async function (
  req,
  res
) {
  console.log('==================== GET BLOCK BY NUMBER ==================')
  let blockId = req.params.blockId
  let peer = 'peer0.customer.jeabc.com'
  let channelName = 'jeabc-channel'
  if (!blockId) {
    res.json(getErrorMessage("'blockId'"))
    return
  }
  let message = await query.getBlockByNumber(
    peer,
    channelName,
    blockId,
    req.username,
    req.orgname
  )
  res.send(message)
})

// Query Transaction by Transaction ID
app.get(baseurl + '/jeabc-channel/transaction_info/:trxnId', async function (
  req,
  res
) {
  console.log(
    '================ GET TRANSACTION BY TRANSACTION_ID ======================'
  )
  let peer = 'peer0.customer.jeabc.com'
  let channelName = 'jeabc-channel'
  let trxnId = req.params.trxnId
  if (!trxnId) {
    res.json(getErrorMessage("'trxnId'"))
    return
  }
  let message = await query.getTransactionByID(
    peer,
    channelName,
    trxnId,
    req.username,
    req.orgname
  )
  console.log(message)
  res.send(message)
})

// Query Block by Hash
app.get(baseurl + '/block/by_hash', async function (req, res) {
  console.log('================ GET BLOCK BY HASH ======================')
  let hash = req.query.hash
  let peer = 'peer0.customer.jeabc.com'
  let channelName = 'jeabc-channel'
  if (!hash) {
    res.json(getErrorMessage("'hash'"))
    return
  }
  let message = await query.getBlockByHash(
    peer,
    channelName,
    hash,
    req.username,
    req.orgname
  )
  res.send(message)
})

// Query for Channel instantiated chaincodes
app.get(baseurl + '/jeabc-channel/instantiated_chaincodes', async function (
  req,
  res
) {
  console.log('============= GET INSTANTIATED CHAINCODES ===================')
  let peer = 'peer0.customer.jeabc.com'
  let channelName = 'jeabc-channel'
  let message = await query.getInstalledChaincodes(
    peer,
    channelName,
    'instantiated',
    req.username,
    req.orgname
  )
  res.send(message)
})

// Query to fetch all Installed chaincodes
app.get(baseurl + '/jeabc-channel/installed_chaincodes', async function (
  req,
  res
) {
  let peer = 'peer0.customer.jeabc.com'
  let channelName = 'jeabc-channel'
  console.log(
    '================ GET INSTALLED CHAINCODES ======================'
  )
  let message = await query.getInstalledChaincodes(
    peer,
    channelName,
    'installed',
    req.username,
    req.orgname
  )
  res.send(message)
})

// Query to fetch channels
app.get(baseurl + '/get_channels', async function (req, res) {
  console.log('================ GET CHANNELS ======================')
  let peer = 'peer1=0.customer.jeabc.com'
  if (!peer) {
    res.json(getErrorMessage("'peer'"))
    return
  }
  let message = await query.getChannels(peer, req.username, req.orgname)
  res.send(message)
})

// ************************************************************************************
// **************************** SmartContract Endpoints *******************************
// ************************************************************************************

app.post(baseurl + '/register_customerOrg', async function (req, res) {
	var args = req.body.args;
	if (!args) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	if (args.length != 6) {
		res.send({
			success: false,
			message: 'Incorrect argument length'
		});
	}
	var channelName = "jeabc-channel";
	var fcn = "registerCustomer";
	var chaincodeName = "customerloyalty";
	var peers = ["peer0.customer.jeabc.com","peer0.company.jeabc.com"];
	var orgName = "Customer";
  
  

	

	if (!args[0] || !args[1] || !args[2] || !args[3] || !args[4] || !args[5]) {
		res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	try {
		let message = await utils.registerNewUser(peers, channelName, chaincodeName, fcn, args, orgName, true);
		console.log(message);
		res.send(message);
	} catch (err) {
		logger.info(err);
		var response = err.toString();
		res.send(response);
	}


});
app.post(baseurl + '/register_customer', async function (req, res) {
	console.log('============= NEW USER REGISTRATION REQUEST==================');
	var args = req.body.args;
	if (!args) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	var channelName = "jeabc-channel";
	var fcn = "registerCustomer";
	var chaincodeName = "customerloyalty";
	var peers =["peer0.company.jeabc.com","peer0.customer.jeabc.com"];
	var orgName = "Customer";
	if (args.length != 6) {
		res.send({
			success: false,
			message: 'Incorrect argument length'
		});
	}
	if (args[0] == null || args[1] == null || args[2] == null || args[3] == null || args[4] == null || args[5] == null ) {
		res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	
	try {
		let message = await utils.registerNewUser(peers, channelName, chaincodeName, fcn, args, orgName, true);
		console.log(message);
		res.send(message);
	} catch (err) {
		logger.info(err);
		var response = err.toString();
		res.send(response);
	}

});
app.post(baseurl + '/register_company', async function (req, res) {
	console.log('============= NEW USER REGISTRATION REQUEST==================');
	var args = req.body.args;
	if (!args) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	var channelName = "jeabc-channel";
	var fcn = "registerCompany";
	var chaincodeName = "customerloyalty";
	var peers = "";
	var orgName = "";

	peers = ["peer0.company.jeabc.com","peer0.customer.jeabc.com"];
	orgName = "Company";
	if (args.length != 3) {
		res.send({
			success: false,
			message: 'Incorrect argument length'
		});
	}
	if (args[0] == null || args[1] == null || args[2] == null) {
		res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	
	try {
		let message = await utils.registerNewUser(peers, channelName, chaincodeName, fcn, args, orgName, true);
		console.log(message);
		res.send(message);
	} catch (err) {
		logger.info(err);
		var response = err.toString();
		res.send(response);
	}

});
app.post(baseurl + '/login', async function (req, res) {
	console.log('==================== QUERY BY CHAINCODE ==================');
	var args = req.body.args;
	if (!args) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	if (args.length != 3) {
		res.send({
			success: false,
			message: 'Incorrect argument length'
		});
	}
	try {

		var channelName = "jeabc-channel";
		var fcn = "authUser";
		var chaincodeName = "customerloyalty";
		var peer = "";
    var orgName = "";

    if (args[2] == "Customer") {
			peer = "peer0.customer.jeabc.com";
      orgName = "Customer";
      
		} else if (args[2] == "Company") {
			peer = "peer0.company.jeabc.com";
      orgName = "Company";
      
     } else {
			response = {
				user: args[0],
				success: false,
				role: null,
				message: 'Invalid User role',
				token: null
			};
			return res.send(response);
		}
	
		var username = args[0];
    var role = args[2];

   
		var token = jwt.sign({
			exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
			username: username,
			orgName: orgName,
			role: role
		}, app.get('secret'));
    
    let response = await utils.getRegisteredUser(username, orgName, true);
    

		let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn,username , orgName );
		var auth = message.toString();
		try {
      var auth_json = JSON.parse(auth);
     
			if (auth_json.success == true) {
				auth_json.token = token;
				console.log(auth_json);
				logger.info("User " + username + " Sucessfully loged in as " + auth_json.role);
				return res.send(auth_json);
			} else {
				auth_json.token = null;
				return res.send(auth_json);
			}
		} catch (err) {
			return res.send(auth);
		}
	} catch (err) {
		var response = {
			user: args[0],
			success: false,
			role: null,
			message: 'Invalid User',
			token: null
		};
		return res.send(response);
	}
});
app.post(baseurl + '/register_companyOrg', async function (req, res) {
	var args = req.body.args;
	if (!args) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	if (args.length != 3) {
		res.send({
			success: false,
			message: 'Incorrect argument length'
		});
	}
	var channelName = "jeabc-channel";
	var fcn = "registerCompany";
	var chaincodeName = "customerloyalty";
	var peers = ["peer0.customer.jeabc.com","peer0.company.jeabc.com"];
	var orgName = "Company";
  
  

	

	if (!args[0] || !args[1] || !args[2]) {
		res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	try {
		let message = await utils.registerNewUser(peers, channelName, chaincodeName, fcn, args, orgName, true);
		console.log(message);
		res.send(message);
	} catch (err) {
		logger.info(err);
		var response = err.toString();
		res.send(response);
	}


});

app.post(baseurl + '/add_offers', async function (req, res) {
	logger.debug('====================Update Invoice ==================');
	var peers = ["peer0.company.jeabc.com","peer0.customer.jeabc.com"];
	var chaincodeName = "customerloyalty";
	var channelName = "jeabc-channel";
	var fcn = "AddOffers";
	var args = req.body.args;
	var username = req.username;
	var orgname = req.orgname;
	if (args[0] == null || args[1] == null || args[2] == null || args[3] == null || args[4]==null) {
		res.send("Invalid input arguments");
	}
	try {
		let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, username, orgname);
		logger.debug(message);
		res.send(message);
	} catch (err) {
		logger.info(err);
		var response = err.toString();
		res.send(response);
	}
});
app.post(baseurl + '/purchase_items', async function (req, res) {
	logger.debug('====================Update Invoice ==================');
	var peers = ["peer0.company.jeabc.com","peer0.customer.jeabc.com"];
	var chaincodeName = "customerloyalty";
	var channelName = "jeabc-channel";
	var fcn = "Purchase";
	var args = req.body.args;
	var username = req.username;
	var orgname = req.orgname;
	if (args[0] == null || args[1] == null || args[2] == null ) {
		res.send("Invalid input arguments");
	}
	try {
		let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, username, orgname);
		logger.debug(message);
		res.send(message);
	} catch (err) {
		logger.info(err);
		var response = err.toString();
		res.send(response);
	}
});

app.get(baseurl + '/get_customer_status/:AccountNumber', async function (req, res) {
	logger.debug('====================Get All Invoice ==================');
	var peer = "peer0.customer.jeabc.com";
	var chaincodeName = "customerloyalty";
	var channelName = "jeabc-channel";
	var fcn = "getCustomerStatus";
	var args = [];
	args.push(req.params.AccountNumber);
	var role = req.role;
	logger.info(role);
	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	logger.debug(message);
	res.send(message);
});
app.get(baseurl + '/get_all_company', async function (req, res) {
	var peer = "peer0.customer.jeabc.com";
	var chaincodeName = "customerloyalty";
	var channelName = "jeabc-channel";
	var fcn = "getAllCompany";
	var args = [];


	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	logger.debug(message);
	res.send(message);
});
app.get(baseurl + '/list_offers/:CompanyID', async function (req, res) {
	logger.debug('====================Get All Invoice ==================');
	var peer = "peer0.customer.jeabc.com";
	var chaincodeName = "customerloyalty";
	var channelName = "jeabc-channel";
	var fcn = "ListOffersOfParticularCompany";
	var args = [];
	args.push(req.params.CompanyID);
	var role = req.role;
	logger.info(role);
	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	logger.debug(message);
	res.send(message);
});
app.get(baseurl + '/list_redemption_offers/:CompanyID', async function (req, res) {
	logger.debug('====================Get All Invoice ==================');
	var peer = "peer0.customer.jeabc.com";
	var chaincodeName = "customerloyalty";
	var channelName = "jeabc-channel";
	var fcn = "ListRedemptionOffersOfParticularCompany";
	var args = [];
	args.push(req.params.CompanyID);
	var role = req.role;
	logger.info(role);
	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	logger.debug(message);
	res.send(message);
});
app.get(baseurl + '/get_customer_history', async function (req, res) {
	logger.debug('====================Get user_energy_history==================');
	var peer = "peer0.customer.jeabc.com";
	var chaincodeName = "customerloyalty";
	var channelName = "jeabc-channel";
	var fcn = "getCustomerHistory";
	var args = [];
	args.push(req.username);
	var role = req.role;
	logger.info(role);
	logger.info("<<>>" + args);
	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	logger.debug(message);
	res.send(message);
});
app.get(baseurl + '/get_company_history', async function (req, res) {
	logger.debug('====================Get user_energy_history==================');
	var peer = "peer0.company.jeabc.com";
	var chaincodeName = "customerloyalty";
	var channelName = "jeabc-channel";
	var fcn = "getCompanyHistory";
	var args = [];
	args.push(req.username);
	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	logger.debug(message);
	res.send(message);
});
////////////////////////////////////////////////////////////////////




