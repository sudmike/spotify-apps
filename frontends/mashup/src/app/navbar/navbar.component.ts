import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
})
export class NavbarComponent implements OnInit {
  show = false;

  constructor(private router: Router, private api: ApiService) {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd)
        this.show = window.location.pathname !== '/';
    });
  }

  logoutAccount() {
    // remove data from browser storage
    sessionStorage.removeItem('loaded');
    localStorage.removeItem('id');

    // navigate to home page
    window.location.href = '/';
  }

  async deleteUser() {
    const confirmationText =
      'Are you sure you want us to delete your account? \nCreated playlists will still exist but you will not be able to manage them with Mashup anymore.';

    if (confirm(confirmationText)) {
      // make backend delete user information
      await this.api.deleteUser();

      // logout
      this.logoutAccount();
    }
  }

  ngOnInit(): void {
    this.show = window.location.pathname !== '/';
  }
}
