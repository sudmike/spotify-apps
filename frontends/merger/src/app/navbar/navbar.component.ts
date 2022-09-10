import { Component, DoCheck, OnInit } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
})
export class NavbarComponent implements OnInit, DoCheck {
  show = false;

  ngOnInit(): void {
    this.show = window.location.pathname !== '/';
  }

  ngDoCheck(): void {
    // necessary for when the route changes
    this.show = window.location.pathname !== '/';
  }
}
