package main

import (
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

const prefixCustomer = "PC"
const prefixCompany = "PM"
const prefixOffer = "PO"
const prefixCustomerHistory = "CUSHITRY"
const prefixCompanyHistory = "CMPNYHISTRY"

const prefixUserHistory = "HYE"
const prefixUtilHistory = "UTILHISTORY"
const projectName = "Jeadigital-Customer_Loyality-Program"
const version = "v1"

var logger = shim.NewLogger("Jeadigital-Customer_Loyality-Program:")

type SmartContract struct {
}

func (s *SmartContract) Init(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("*** " + projectName + " *** " + version + " Init ***")
	return shim.Success(nil)
}

func (s *SmartContract) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("*** " + projectName + " *** " + version + " Invoke ***")
	function, args := stub.GetFunctionAndParameters()
	logger.Info("Function: " + function)
	switch function {
	case "registerCustomer":
		return s.registerCustomer(stub, args)
	case "registerCompany":
		return s.registerCompany(stub, args)
	case "authUser":
		return s.authUser(stub, args)
	case "Purchase":
		return s.Purchase(stub, args)
	case "getCustomerStatus":
		return s.getCustomerStatus(stub, args)
	case "getAllCompany":
		return s.getAllCompany(stub)
	case "ListOffersOfParticularCompany":
		return s.ListOffersOfParticularCompany(stub, args)
	case "AddOffers":
		return s.AddOffers(stub, args)
	case "ListRedemptionOffersOfParticularCompany":
		return s.ListRedemptionOffersOfParticularCompany(stub, args)
	case "getCustomerHistory":
		return s.getCustomerHistory(stub, args)
	case "getCompanyHistory":
		return s.getCompanyHistory(stub, args)

	default:
		jsonResp := "{\"status\":false,\"description\":\"Invalid Smart Contract function name.\"}"
		return shim.Error(jsonResp)
	}
}
func main() {
	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
