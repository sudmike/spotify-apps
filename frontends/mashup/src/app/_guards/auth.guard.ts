import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { ApiService } from '../services/api.service';
import { env } from "../../../env.dev";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private api: ApiService) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const loaded = sessionStorage.getItem('loaded');
    const id = localStorage.getItem('id');

    if (!id) {
      window.location.href = env.production ? `${env.backendUrl}/mashup/login` : '/api/mashup/login';
      localStorage.setItem('returnUrl', state.url);
      return false;
    } else {
      if (loaded) return true;
      else {
        // check log in
        if (await this.api.checkAuth()) {
          sessionStorage.setItem('loaded', 'true');
          return true;
        }  else { // if auth is invalid, remove potential bad token from local storage to break the loop
          localStorage.removeItem('id');
          return false;
        }
      }
    }
  }
}
