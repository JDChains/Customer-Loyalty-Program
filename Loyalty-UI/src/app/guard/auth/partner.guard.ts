import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class PartnerGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    let url: string = state.url;
    return(this.checkLogin(url))
  }
  checkLogin(url: string): boolean {
    console.log('entered auth');
   console.log(this.authService.partnerLoggedIn());
    if (this.authService.partnerLoggedIn()) { 
      return true; 
    }
    this.router.navigate(['/partners/login']);
    return false;
  }
}