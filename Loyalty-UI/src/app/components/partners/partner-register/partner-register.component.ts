import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service'
import { Router } from '@angular/router';
@Component({
  selector: 'app-partner-register',
  templateUrl: './partner-register.component.html',
  styleUrls: ['./partner-register.component.css']
})
export class PartnerRegisterComponent implements OnInit {
  accID:String;
  accNo:String;
  name:String;
  result:Boolean=false
  message:String
  constructor(private api:ApiService,private route:Router) { }
  ngOnInit() {
  }
  registerPartner(){
    this.result=false
    var data=[]
    
    data.push(this.accNo)
    data.push(this.accID)
    data.push(this.name)
    
    console.log(data)
    this.api.registerPartner({"args":data}).subscribe(result=>{
      this.result=true
      console.log(result)
      this.message=result["message"]
      
    },err=>{
      console.log(err)
    })
  }


}
