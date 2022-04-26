import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { CallbackComponent } from './login/callback/callback.component';
import { AuthGuard } from './_guards/auth.guard';

@NgModule({
  declarations: [AppComponent, LoginComponent, CallbackComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [AuthGuard],
  bootstrap: [AppComponent],
})
export class AppModule {}
