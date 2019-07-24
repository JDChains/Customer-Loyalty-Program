import { Component, OnInit } from '@angular/core';
import {ApiService} from '../../../services/api.service'
import {Router} from '@angular/router'
@Component({
  selector: 'app-partner-login',
  templateUrl: './partner-login.component.html',
  styleUrls: ['./partner-login.component.css']
})
export class PartnerLoginComponent implements OnInit {
  accNo:String
  accId:String
  result:Boolean=false
  message:String
  constructor(private api:ApiService,private route:Router) { }

  ngOnInit() {
  }
  loginPartner(){
    this.result=false
    var data=[]
    data.push(this.accNo)
    data.push(this.accId)
    data.push("Company")
    console.log(data)
    this.api.loginMember({"args":data}).subscribe(
      result=>{
        this.result=true
        this.message=result['message']
        if(result['success']){
          sessionStorage.setItem("CompanyToken",result["token"])
          sessionStorage.setItem("Company",result["User"])
          this.route.navigate(['/partners'])
        }
        console.log(result)
      },err=>{
        console.log(err)
      }
    )
  }


}
