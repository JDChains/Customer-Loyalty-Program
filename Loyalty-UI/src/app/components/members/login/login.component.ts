import { Component, OnInit } from '@angular/core';
import {ApiService} from '../../../services/api.service'
import {Router} from '@angular/router'
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  accNo:String
  accId:String
  result:Boolean=false
  message:String
  constructor(private api:ApiService,private route:Router) { }

  ngOnInit() {
  }
  loginMember(){
    this.result=false
    var data=[]
    data.push(this.accNo)
    data.push(this.accId)
    data.push("Customer")
    this.api.loginMember({"args":data}).subscribe(
      result=>{
       

        this.result=true
        this.message=result['message']
        if(result['success']){
          sessionStorage.setItem("CustomerToken",result["token"])
          sessionStorage.setItem("user",result["User"])
          this.route.navigate(['/members'])
        }
        console.log("*******************************");
        console.log(result);
        console.log("*******************************");
        console.log(result);
      },err=>{
        console.log(err)
      }
    )
  }

}
