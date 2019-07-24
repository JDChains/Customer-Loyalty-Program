# ---------------------------------------------------------------------------
# Generate certificates using cryptogen tool 
# ---------------------------------------------------------------------------

CHANNEL_NAME="jeabc-channel"

which cryptogen
if [ "$?" -ne 0 ]; then
echo "cryptogen tool not found. exiting..."
exit 1
fi
  echo
  echo "----------------------------------------------------------"
  echo "##### Generate certificates using cryptogen tool #########"
  echo "----------------------------------------------------------"
    if [ -d "crypto-config" ]; then
    rm -Rf crypto-config
  fi
  cryptogen generate --config=cryptogen.yaml
  if [ "$?" -ne 0 ]; then
    echo "Failed to generate certificates..."
    exit 1
  fi
  echo "successfully Generated certificates using cryptogen tool"

#-----------------------------------------------------------------------------
# Generate genesis block ,channel.tx and anchor peer using configtxgen tool
#-----------------------------------------------------------------------------
     which configtxgen
  if [ "$?" -ne 0 ]; then
    echo "configtxgen tool not found. exiting..."
    exit 1
  fi

  echo "-----------------------------------------------------"
  echo "#########  Generating Orderer Genesis block #########"
  echo "-----------------------------------------------------"
  configtxgen -profile jeabc-Genesis -outputBlock ./genesis.block -channelID orderer-system-channel

  if [ "$?" -ne 0 ]; then
    echo "Failed to generate orderer genesis block..."
    exit 1
  fi
  echo
  echo "--------------------------------------------------------------------------------"
  echo "### Generating channel configuration transaction 'jeabc-channel.tx' ###"
  echo "--------------------------------------------------------------------------------"
  configtxgen -profile jeabc-channel -outputCreateChannelTx ./jeabc-channel.tx -channelID $CHANNEL_NAME

  if [ "$?" -ne 0 ]; then
    echo "Failed to generate channel configuration transaction..."
    exit 1
  fi

  echo
  echo "-----------------------------------------------------------------------------------------------------"
  echo "#######  Generating anchor peer update  Customer, Company ###########"
  echo "-----------------------------------------------------------------------------------------------------"
  configtxgen -profile jeabc-channel -outputAnchorPeersUpdate ./CustomerMSPanchors.tx -channelID $CHANNEL_NAME -asOrg CustomerMSP
  configtxgen -profile jeabc-channel -outputAnchorPeersUpdate ./CompanyMSPanchors.tx -channelID $CHANNEL_NAME -asOrg CompanyMSP
  
  if [ "$?" -ne 0 ]; then
    echo "Failed to generate anchor peer ..."
    exit 1
  fi
