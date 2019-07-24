import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }
  customerLoggedIn(){
    if(sessionStorage.getItem("CustomerToken")){
      return true
    }else{
      return false
    }
  }
  partnerLoggedIn(){
    if(sessionStorage.getItem("CompanyToken")){
      return true
    }else{
      return false
    }
  }
}
