import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
})
export class CallbackComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      if (params['id']) {
        localStorage.setItem('id', params['id']);

        // redirect
        const returnUrl = localStorage.getItem('returnUrl');
        localStorage.removeItem('returnUrl');
        await this.router.navigate(returnUrl ? [returnUrl] : ['dashboard']);
      }
    });
  }
}
