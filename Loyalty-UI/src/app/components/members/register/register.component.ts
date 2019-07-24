import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service'
import { Router } from '@angular/router';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  accNo:String;
  accId:String;
  fName:String;
  lName:String;
  email:String;
  pnNo:String;
  result:Boolean=false
  message:String
  constructor(private api:ApiService,private route:Router) { }

  ngOnInit() {
  }
  registerMember(){
    this.result=false
    var data=[]
    
    data.push(this.accNo)
    data.push(this.accId)
    data.push(this.fName)
    data.push(this.lName)
    data.push(this.email)
    data.push(this.pnNo)
    console.log(data)
    this.api.registerMember({"args":data}).subscribe(result=>{
      this.result=true
      console.log(result)
      this.message=result["message"]
      
    },err=>{
      console.log(err)
    })
  }

}
