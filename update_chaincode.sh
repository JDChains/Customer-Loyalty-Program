# --------------------------------------------------------------------------------------------
# create channels,join peer nodes to the channel,install chaincodes and instantiate chaincodes
# --------------------------------------------------------------------------------------------

jq --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
	echo "Please Install 'jq' to execute this script"
	echo
	exit 1
fi

starttime=$(date +%s)

# Language defaults to "golang"
LANGUAGE="golang"
CCNAME="customerloyalty"
CCVERSION="v1"

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

setChaincodePath
sleep 2
#===========================================================================================================================
echo "POST request Enroll on Customer  ..."
echo
ORG1_TOKEN=$(curl -s -X POST \
  http://localhost:4002/api/auth_user \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=CustomerAdmin&orgName=Customer')
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
  -d 'username=CompanyAdmin&orgName=Company')
echo $ORG2_TOKEN
ORG2_TOKEN=$(echo $ORG2_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG2 token is $ORG2_TOKEN"
echo
echo

#===========================================================================================================================
echo "POST Install chaincode on Customer"
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
echo "POST Install chaincode on Company"
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
echo "POST instantiate chaincode on peer0 of Customer"
echo
curl -s -X POST \
  http://localhost:4002/api/upgrade_chaincode/jeabc-channel/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.customer.jeabc.com\",\"peer0.company.jeabc.com\"],
	\"chaincodeName\":\"$CCNAME\",
	\"chaincodeVersion\":\"$CCVERSION\",
	\"chaincodeType\": \"$LANGUAGE\",
  \"args\":[\" \"]
}"


echo
echo "Total execution time : $(($(date +%s)-starttime)) secs ..."
