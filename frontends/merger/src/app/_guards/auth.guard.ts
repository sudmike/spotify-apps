import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { ApiService } from '../services/api.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private api: ApiService) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const loaded = sessionStorage.getItem('loaded');
    const id = localStorage.getItem('id');

    if (!id) {
      window.location.href = '/api/merger/login';
      localStorage.setItem('returnUrl', state.url);
      return false;
    } else {
      if (loaded) return true;
      else {
        // check log in
        if (await this.api.checkAuth()) {
          sessionStorage.setItem('loaded', 'true');
          return true;
        } else return false;
      }
    }
  }
}
