import { Component, OnInit } from '@angular/core';
import {ApiService} from '../../../services/api.service'
import { Router } from '@angular/router';
interface Value{
  "Type":String;
  "PointCredit":Number;
  "PointDebit":Number;
  "OfferID":String;
  "User":String;
}
interface History {
  "timestamp":String;
  "value":Value;
  "TxId":String;
}
@Component({
  selector: 'app-partner-home',
  templateUrl: './partner-home.component.html',
  styleUrls: ['./partner-home.component.css']
})

export class PartnerHomeComponent implements OnInit {

  constructor(private api:ApiService,private router: Router) { }
  offerID:String
  deals:String
  type:String
  coins:String
  success:Boolean=false
  message:String
  history:Array<History>=[]
  ngOnInit() {
    this.getHistory()
  }
  AddOffer(){
    var query=[]
    query.push(this.offerID)
    query.push(sessionStorage.getItem("Company"))
    query.push(this.deals)
    query.push(this.coins)
    query.push(this.type)
    this.api.addOffer(query).subscribe(result=>{
      console.log(result)
      if(result["success"]){
        this.success=true
        this.message="Transaction Id : "+result["tx_id"]
      }else{
        this.success=false
        this.message="Error processing request"
      }
    },err=>{
      console.log(err)
    })
  }
  getHistory(){
    this.api.getHistoryCompany().subscribe((result:Array<History>)=>{
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
