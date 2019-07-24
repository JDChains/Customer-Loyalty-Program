import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service'
import { Router } from '@angular/router';
interface company {
  CompanyName: String;
  CompanyId: String;
}
interface Offers {
  OfferID: String;
  CompanyID: String;
  Type: String;
  Deals: String;
  Token: Number;
}
interface Value{
  "Type":String;
  "PointCredit":Number;
  "PointDebit":Number;
  "OfferID":String;
  
}
interface History {
  "timestamp":String;
  "value":Value;
  "TxId":String;
}
@Component({
  selector: 'app-member-home',
  templateUrl: './member-home.component.html',
  styleUrls: ['./member-home.component.css']
})

export class MemberHomeComponent implements OnInit {
  coinBalance:Number
  company: String
  showOffer: Boolean = false
  offers: Array<Offers> = []
  redemptionOffers: Array<Offers> = []
  success: Boolean = false
  message:String
  constructor(private api: ApiService,private router: Router) { }
  companies:Array<company> = []
  history:Array<History>=[]
 
  ngOnInit() {
    this.userStatus()
    this.api.getAllCompanies().subscribe((result: Array<company>) => {
      this.companies=result
      console.log(this.companies)
    })
    this.getHistory()
  }
  userStatus(){
    this.api.getStatus(sessionStorage.getItem("user")).subscribe(result=>{
      this.coinBalance=result["Points"]
    })
  }
  listPurchaseOffers() {
    console.log(this.company)
    this.showOffer = false
    this.api.getOffersCompany(this.company).subscribe((result: Array<Offers>) => {
      this.offers = result
    }, err => {
      console.log(err)
    })
  }
  listRedemptionOffers() {
    console.log(this.company)
    this.showOffer = false
    this.api.getRedemptionOffersCompany(this.company).subscribe((result: Array<Offers>) => {
      this.redemptionOffers = result
    }, err => {
      console.log(err)
    })
  }
  purchase(data:Offers) {
    var query = []
    console.log(data)
    query.push(sessionStorage.getItem("user"))
    query.push(data.OfferID)
    query.push(data.CompanyID)

    this.api.purchase(query).subscribe(result => {
      if (result["success"]) {
        this.userStatus()
        this.getHistory()
        console.log(result)
        this.success=true
        this.message="Transaction Id :"+result["tx_id"]
      }
    })
    
  }
  getHistory(){
    this.api.getHistoryCustomer().subscribe((result:Array<History>)=>{
      this.history=result
      console.log(this.history)
    },err=>{
      console.log(err)
    })
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/'])
  }
}
