# --------------------------------------------------------------------------------------------
# create channels,join peer nodes to the channel,install chaincodes and instantiate chaincodes
# --------------------------------------------------------------------------------------------

jq --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
	echo "Please Install 'jq' to execute this script"
	echo
	exit 1
fi
sleep 5
starttime=$(date +%s)

# Language defaults to "golang"
LANGUAGE="golang"
CCNAME="customerloyalty"
CCVERSION="v0"

##set chaincode path
function setChaincodePath(){
	LANGUAGE=`echo "$LANGUAGE" | tr '[:upper:]' '[:lower:]'`
	case "$LANGUAGE" in
		"golang")
		CC_SRC_PATH="chaincode"
		;;
		"node")
		CC_SRC_PATH="$PWD/artifacts/src/chaincode"
		;;
		*) printf "\n ------ Language $LANGUAGE is not supported yet ------\n"$
		exit 1
	esac
}
# Creating New Affiliation
# =============================================================================================

echo "Creating New Affiliation: customer.department1"
echo
RESP=$(curl -s -X POST \
  http://localhost:4002/api/newAffiliation \
  -H "content-type: application/json" \
  -d '{
    "orgName":"Customer",
    "affliation":"department1"
}')
echo " $RESP"

echo "Creating New Affiliation: company.department1"
echo
RESP=$(curl -s -X POST \
  http://localhost:4002/api/newAffiliation \
  -H "content-type: application/json" \
  -d '{
    "orgName":"Company",
    "affliation":"department1"
}')
echo " $RESP"




setChaincodePath
sleep 2
#===========================================================================================================================
echo "POST request Enroll on Customer  ..."
echo
ORG1_TOKEN=$(curl -s -X POST \
  http://localhost:4002/api/auth_user \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Admin&orgName=Customer')
echo $ORG1_TOKEN
ORG1_TOKEN=$(echo $ORG1_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG1 token is $ORG1_TOKEN"
echo
#===========================================================================================================================
echo "POST request Enroll on Company ..."
echo
ORG2_TOKEN=$(curl -s -X POST \
  http://localhost:4002/api/auth_user \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Admin&orgName=Company')
echo $ORG2_TOKEN
ORG2_TOKEN=$(echo $ORG2_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG2 token is $ORG2_TOKEN"
echo
echo

#===========================================================================================================================
echo "POST request Create channel  ..."
echo
curl -s -X POST \
  http://localhost:4002/api/create_channels \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"channelName":"jeabc-channel",
	"channelConfigPath":"../artifacts/channel/jeabc-channel.tx"
}'
echo
echo
sleep 5
#===========================================================================================================================
echo "POST request Join channel on customer"
echo
curl -s -X POST \
  http://localhost:4002/api/join_channels/jeabc-channel/peers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.customer.jeabc.com"]
}'
echo
echo
#===========================================================================================================================
echo "POST request Join channel on company"
echo
curl -s -X POST \
  http://localhost:4002/api/join_channels/jeabc-channel/peers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.company.jeabc.com"]
}'
echo
echo

#===========================================================================================================================
echo "POST request Update anchor peers on customer"
echo
curl -s -X POST \
  http://localhost:4002/api/channels/jeabc-channel/anchorpeers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../artifacts/channel/CustomerMSPanchors.tx"
}'
echo
echo

echo "POST request Update anchor peers on Company"
echo
curl -s -X POST \
  http://localhost:4002/api/channels/jeabc-channel/anchorpeers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../artifacts/channel/CompanyMSPanchors.tx"
}'
echo
echo

#===========================================================================================================================
echo "POST Install chaincode on customer"
echo
curl -s -X POST \
  http://localhost:4002/api/install_chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.customer.jeabc.com\"],
	\"chaincodeName\":\"$CCNAME\",
	\"chaincodePath\":\"$CC_SRC_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"$CCVERSION\"
}"
echo
echo
#===========================================================================================================================
echo "POST Install chaincode on company"
echo
curl -s -X POST \
  http://localhost:4002/api/install_chaincodes \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.company.jeabc.com\"],
	\"chaincodeName\":\"$CCNAME\",
	\"chaincodePath\":\"$CC_SRC_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"$CCVERSION\"
}"
echo

#===========================================================================================================================
echo "POST instantiate chaincode on peer0 of customer"
echo
curl -s -X POST \
  http://localhost:4002/api/instantiate_chaincode/jeabc-channel/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.customer.jeabc.com\",\"peer0.company.jeabc.com\"],
	\"chaincodeName\":\"$CCNAME\",
	\"chaincodeVersion\":\"$CCVERSION\",
	\"chaincodeType\": \"$LANGUAGE\",
  \"args\":[\" \"]
}"
#===========================================================================================================================

echo
echo "Total execution time : $(($(date +%s)-starttime)) secs ..."
