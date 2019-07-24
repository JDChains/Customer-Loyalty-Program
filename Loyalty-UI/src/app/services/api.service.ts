import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http'
import {UtilService } from '../services/util.service'
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http:HttpClient,private util:UtilService) { }
  registerMember(data){
    return this.http.post(UtilService.src+'register_customer',data,{
        headers: {
          'Content-Type': 'application/json'       
        }
      
    })
  }
  loginMember(data){
    return this.http.post(UtilService.src+'login',data,{
      headers: {
        'Content-Type': 'application/json'       
      }
    })
  }
  registerPartner(data){
    return this.http.post(UtilService.src+'register_company',data,{
        headers: {
          'Content-Type': 'application/json'       
        }
      
    })
  }
  loginPartner(data){
    return this.http.post(UtilService.src+'login',data,{
      headers: {
        'Content-Type': 'application/json'       
      }
    })
  }
  getAllCompanies(){
    return this.http.get(UtilService.src+'get_all_company',{
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem("CustomerToken")    
      }
    })
  }
  getOffersCompany(cName){
    return this.http.get(UtilService.src+'list_offers/'+cName,{
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem("CustomerToken")    
      }
    })
  }
  getRedemptionOffersCompany(cName){
    return this.http.get(UtilService.src+'list_redemption_offers/'+cName,{
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem("CustomerToken")    
      }
    })
  }
  purchase(data){
    console.log(data)
    return this.http.post(UtilService.src+'purchase_items',{"args":data},{
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem("CustomerToken")    
      }
    })
  }
  getStatus(uName){
    return this.http.get(UtilService.src+'get_customer_status/'+uName,{
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem("CustomerToken")    
      }
    })
  }
  addOffer(data){
    console.log(data)
    return this.http.post(UtilService.src+'add_offers',{"args":data},{
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem("CompanyToken")    
      }
    })
  }
  getHistoryCustomer(){
    return this.http.get(UtilService.src+'get_customer_history',{
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem("CustomerToken")    
      }
    })
  }
  getHistoryCompany(){
    return this.http.get(UtilService.src+'get_company_history',{
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem("CompanyToken")    
      }
    })
  }
}
