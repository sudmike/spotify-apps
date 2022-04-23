import { Component } from '@angular/core';
import { env } from '../../../env.dev';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
})
export class LoginComponent {
  backendUrl = env.backendUrl;
}
