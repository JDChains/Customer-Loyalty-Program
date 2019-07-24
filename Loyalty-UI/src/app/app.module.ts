import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/members/login/login.component';
import { RegisterComponent } from './components/members/register/register.component';
import { MemberHomeComponent } from './components/members/member-home/member-home.component';
import { FormsModule } from '@angular/forms'
import { ApiService } from './services/api.service'
import { UtilService } from './services/util.service';
import { HttpClientModule } from '@angular/common/http';
import { PartnerHomeComponent } from './components/partners/partner-home/partner-home.component';
import { PartnerLoginComponent } from './components/partners/partner-login/partner-login.component';
import { PartnerRegisterComponent } from './components/partners/partner-register/partner-register.component'; @NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    MemberHomeComponent,
    PartnerHomeComponent,
    PartnerLoginComponent,
    PartnerRegisterComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [ApiService, UtilService],
  bootstrap: [AppComponent]
})
export class AppModule { }
