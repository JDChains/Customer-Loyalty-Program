package main

import (
	"bytes"
	"encoding/json"
	"strconv"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

func (s *SmartContract) registerCustomer(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	if len(args) != 6 {
		return shim.Error("Incorrect number of arguments. Expecting 7")
	}
	customer := Customer{}
	customer.AccountNumber = args[0]
	customer.AccessCardID = args[1]
	customer.FirstName = args[2]
	customer.LastName = args[3]
	customer.EmailID = args[4]
	customer.PhoneNumber = args[5]
	customer.Points = 0

	key, err := stub.CreateCompositeKey(prefixCustomer, []string{args[0]})
	if err != nil {
		return shim.Error(err.Error())
	}
	customerAsBytes, _ := stub.GetState(key)
	if customerAsBytes != nil {
		return shim.Error("Customer already exist !")
	}
	customerAsBytes, err = json.Marshal(customer)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(key, customerAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte("{\"User\":\"" + args[1] + "\",\"status\":true,\"description\":\"Customer is successfully Registered\"}"))

}
func (s *SmartContract) registerCompany(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}
	company := Company{}
	company.CompanyID = args[0]
	company.AccessCardID = args[1]
	company.CompanyName = args[2]
	company.CompanyPoints = 0

	key, err := stub.CreateCompositeKey(prefixCompany, []string{args[0]})
	if err != nil {
		return shim.Error(err.Error())
	}
	companyAsBytes, _ := stub.GetState(key)
	if companyAsBytes != nil {
		return shim.Error("Company already exist !")
	}
	companyAsBytes, err = json.Marshal(company)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(key, companyAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte("{\"User\":\"" + args[1] + "\",\"status\":true,\"description\":\"Company is successfully Registered\"}"))

}
func (s *SmartContract) authUser(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("***" + projectName + "***" + version + "Auth user ***")
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}
	logger.Info(args[0])

	if args[2] == "Customer" {
		key, err := stub.CreateCompositeKey(prefixCustomer, []string{args[0]})
		if err != nil {
			return shim.Error(err.Error())
		}
		customerAsBytes, _ := stub.GetState(key)
		if customerAsBytes == nil {
			return shim.Error("Invalid Customer")
		}
		customer := Customer{}
		err = json.Unmarshal(customerAsBytes, &customer)
		if customer.AccessCardID == args[1] {
			jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":true,\"role\":\"\",\"message\":\"Login successful\"}"
			return shim.Success([]byte(jsonResp))
		}
		jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":false,\"category\":\"\",\"message\":\"Invalid username or password\"}"
		return shim.Success([]byte(jsonResp))
	}
	if args[2] == "Company" {

		key1, err := stub.CreateCompositeKey(prefixCompany, []string{args[0]})
		if err != nil {
			return shim.Error(err.Error())
		}
		companyAsBytes, _ := stub.GetState(key1)
		if companyAsBytes == nil {
			return shim.Error("Invalid company id")
		}

		company := Company{}
		err = json.Unmarshal(companyAsBytes, &company)
		if company.AccessCardID == args[1] {
			jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":true,\"role\":\"\",\"message\":\"Login successful\"}"
			return shim.Success([]byte(jsonResp))
		}
		jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":false,\"category\":\"\",\"message\":\"Invalid username or password\"}"
		return shim.Success([]byte(jsonResp))
	}

	return shim.Error("Invalid user role")
}
func (s *SmartContract) AddOffers(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	offer := Offers{}
	offer.OfferID = args[0]
	offer.CompanyID = args[1]
	offer.Type = args[4]
	offer.Deals = args[2]
	offer.Token, _ = strconv.Atoi(args[3])

	key, err := stub.CreateCompositeKey(prefixOffer, []string{args[0]})
	if err != nil {
		return shim.Error(err.Error())
	}

	offerAsBytes, _ := stub.GetState(key)
	if offerAsBytes != nil {
		return shim.Error("Offer already exist !")
	}
	offerAsBytes, err = json.Marshal(offer)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(key, offerAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte("{\"User\":\"" + args[0] + "\",\"status\":true,\"description\":\"New offer is successfully Registered\"}"))

}

func (s *SmartContract) Purchase(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	customerHistory := CustomerHistory{}
	companyHistory := CompanyHistory{}
	companyHistory.User = args[0]

	Customerkey, err := stub.CreateCompositeKey(prefixCustomer, []string{args[0]})
	if err != nil {
		return shim.Error(err.Error())
	}
	customerAsBytes, err := stub.GetState(Customerkey)
	if customerAsBytes == nil {
		return shim.Error("Invalid Customer")
	}
	customer := Customer{}
	err = json.Unmarshal(customerAsBytes, &customer)
	//************************************************************************
	Offerkey, err := stub.CreateCompositeKey(prefixOffer, []string{args[1]})
	if err != nil {
		return shim.Error(err.Error())
	}
	offerAsBytes, err := stub.GetState(Offerkey)
	if offerAsBytes == nil {
		return shim.Error("Invalid Offer")
	}
	offer := Offers{}
	offer.CompanyID = args[2]
	customerHistory.OfferID = args[1]
	companyHistory.OfferID = args[1]
	err = json.Unmarshal(offerAsBytes, &offer)
	//**********************************************************************************
	Companykey, err := stub.CreateCompositeKey(prefixCompany, []string{args[2]})
	if err != nil {
		return shim.Error(err.Error())
	}
	companyAsBytes, err := stub.GetState(Companykey)
	if companyAsBytes == nil {
		return shim.Error("Invalid company")
	}
	company := Company{}

	err = json.Unmarshal(companyAsBytes, &company)

	//****************************************************************************

	if offer.Type == "Purchase" {
		customer.Points = customer.Points + offer.Token
		company.CompanyPoints = company.CompanyPoints - offer.Token
		customerHistory.Type = "Purchase"
		customerHistory.PointCredit = customer.Points
		companyHistory.PointDebit = company.CompanyPoints
		companyHistory.Type = "Purchase"
		companyHistory.PointDebit = company.CompanyPoints

	} else if offer.Type == "Redemption" {
		customer.Points = customer.Points - offer.Token
		company.CompanyPoints = company.CompanyPoints + offer.Token
		customerHistory.Type = "Redemption"
		customerHistory.PointDebit = customer.Points
		companyHistory.PointCredit = company.CompanyPoints
		companyHistory.Type = "Redemption"

	} else {
		return shim.Error("Invalid Type")
	}
	//****************************************************************************************
	customerAsBytes, err = json.Marshal(customer)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(Customerkey, customerAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	//*****************************************************************************
	offerAsBytes, err = json.Marshal(offer)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(Offerkey, offerAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	//***********************************************************************************
	companyAsBytes, err = json.Marshal(company)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(Companykey, companyAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	//***************************************************************************
	customerHistorykey, err := stub.CreateCompositeKey(prefixCustomerHistory, []string{args[0]})
	companyHistorykey, err := stub.CreateCompositeKey(prefixCompanyHistory, []string{args[2]})
	customerHistoryAsbytes, err := json.Marshal(customerHistory)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(customerHistorykey, customerHistoryAsbytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	companyHistoryAsbytes, err := json.Marshal(companyHistory)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(companyHistorykey, companyHistoryAsbytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte("Successfully purchased items"))

}
func (s *SmartContract) getCustomerStatus(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	key, err := stub.CreateCompositeKey(prefixCustomer, []string{args[0]})
	if err != nil {
		return shim.Error(err.Error())
	}
	customerAsBytes, err := stub.GetState(key)
	if customerAsBytes == nil {
		return shim.Error("Invalid user")
	}
	customer := Customer{}
	err = json.Unmarshal(customerAsBytes, &customer)
	customer.AccessCardID = "****"
	customerAsBytes, err = json.Marshal(customer)
	return shim.Success(customerAsBytes)

}
func (s *SmartContract) getAllCompany(stub shim.ChaincodeStubInterface) pb.Response {
	results := []interface{}{}
	resultsIterator, err := stub.GetStateByPartialCompositeKey(prefixCompany, []string{})
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		kvResult, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		company := Company{}
		err = json.Unmarshal(kvResult.Value, &company)
		if err != nil {
			return shim.Error(err.Error())
		}
		company.AccessCardID = "****"
		results = append(results, company)

	}

	companyAsBytes, err := json.Marshal(results)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(companyAsBytes)

}
func (s *SmartContract) ListOffersOfParticularCompany(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	results := []interface{}{}
	resultsIterator, err := stub.GetStateByPartialCompositeKey(prefixOffer, []string{})
	if err != nil {
		return shim.Error(err.Error())
	}

	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		kvResult, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		offer := Offers{}
		err = json.Unmarshal(kvResult.Value, &offer)
		if err != nil {
			return shim.Error(err.Error())
		}
		if offer.CompanyID == args[0] && offer.Type == "Purchase" {
			results = append(results, offer)
		}
	}
	offerAsBytes, err := json.Marshal(results)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(offerAsBytes)

}
func (s *SmartContract) ListRedemptionOffersOfParticularCompany(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	results := []interface{}{}
	resultsIterator, err := stub.GetStateByPartialCompositeKey(prefixOffer, []string{})
	if err != nil {
		return shim.Error(err.Error())
	}

	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		kvResult, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		offer := Offers{}
		err = json.Unmarshal(kvResult.Value, &offer)
		if err != nil {
			return shim.Error(err.Error())
		}
		if offer.CompanyID == args[0] && offer.Type == "Redemption" {
			results = append(results, offer)
		}
	}
	offerAsBytes, err := json.Marshal(results)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(offerAsBytes)

}
func (s *SmartContract) getCustomerHistory(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("***" + projectName + "***" + version + "Get History of Energy***")
	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	logger.Info("Getting history of resident:" + args[0])
	key, _ := stub.CreateCompositeKey(prefixCustomerHistory, []string{args[0]})
	resultsIterator, err := stub.GetHistoryForKey(key)
	if err != nil {
		return shim.Error("{\"status\":false,\"description\":\"" + err.Error() + "\"}")
	}
	defer resultsIterator.Close()
	// buffer is a JSON array containing historic values for the invoice
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return shim.Error("{\"status\":false,\"description\":\"" + err.Error() + "\"}")
		}
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"value\":")
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"isDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	logger.Info("History: \n" + buffer.String())
	return shim.Success(buffer.Bytes())
}
func (s *SmartContract) getCompanyHistory(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("***" + projectName + "***" + version + "Get History Energy from all residents ***")
	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	key, _ := stub.CreateCompositeKey(prefixCompanyHistory, []string{args[0]})
	resultsIterator, err := stub.GetHistoryForKey(key)
	if err != nil {
		return shim.Error("{\"status\":false,\"description\":\"" + err.Error() + "\"}")
	}
	defer resultsIterator.Close()
	// buffer is a JSON array containing historic values for the invoice
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return shim.Error("{\"status\":false,\"description\":\"" + err.Error() + "\"}")
		}
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"value\":")
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"isDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	logger.Info("History: \n" + buffer.String())
	return shim.Success(buffer.Bytes())
}
