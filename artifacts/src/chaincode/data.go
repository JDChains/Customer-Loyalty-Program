package main

type Customer struct {
	AccountNumber string `json:"AccountNumber"`
	AccessCardID  string `json:"AccessCardID"`
	FirstName     string `json:"FirstName"`
	LastName      string `json:"LastName"`
	EmailID       string `json:"EmailID"`
	PhoneNumber   string `json:"PhoneNumber"`
	Points        int    `json:"Points"`
}
type Company struct {
	CompanyID     string `json:"CompanyID"`
	AccessCardID  string `json:"AccessCardID"`
	CompanyName   string `json:"CompanyName"`
	CompanyPoints int    `json:"CompanyPoints"`
}
type Offers struct {
	OfferID   string `json:"OfferID"`
	CompanyID string `json:"CompanyID"`
	Type      string `json:"Type"`
	Deals     string `json:"Deals"`
	Token     int    `json:"Token"`
}
type CustomerHistory struct {
	Type        string `json:"Type"`
	PointCredit int    `json:"PointCredit"`
	PointDebit  int    `json:"PointDebit"`
	OfferID     string `json:"OfferID"`
}
type CompanyHistory struct {
	Type        string `json:"Type"`
	PointCredit int    `json:"PointCredit"`
	PointDebit  int    `json:"PointDebit"`
	OfferID     string `json:"OfferID"`
	User        string `json:"User"`
}
