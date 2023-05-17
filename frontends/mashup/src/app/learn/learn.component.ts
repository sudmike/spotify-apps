import { Component } from '@angular/core';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-learn',
  templateUrl: './learn.component.html',
  styleUrls: ['./learn.component.less'],
})
export class LearnComponent {
  constructor(private title: TitleService) {
    this.title.setTitle('Learn More');
  }
}
