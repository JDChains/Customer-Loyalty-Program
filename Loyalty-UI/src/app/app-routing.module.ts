import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/members/login/login.component';
import { RegisterComponent } from './components/members/register/register.component';
import { MemberHomeComponent } from './components/members/member-home/member-home.component';
import { AuthGuard } from './guard/auth/login.guard';
import { PartnerHomeComponent } from './components/partners/partner-home/partner-home.component';
import { PartnerLoginComponent } from './components/partners/partner-login/partner-login.component';
import { PartnerRegisterComponent } from './components/partners/partner-register/partner-register.component';
import { PartnerGuard } from './guard/auth/partner.guard';

const routes: Routes = [
  {path:'home',component:HomeComponent},
  {path:'members',children:[
    {path:'',component:MemberHomeComponent,canActivate:[AuthGuard]},
    {path:'login',component:LoginComponent},
    {path:'signup',component:RegisterComponent}
  ]},
  {path:'partners',children:[
    {path:'',canActivate:[PartnerGuard],component:PartnerHomeComponent},
    {path:'login',component:PartnerLoginComponent},
    {path:'signup',component:PartnerRegisterComponent}
  ]},
  {path:'',redirectTo:'home',pathMatch:"full"},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
