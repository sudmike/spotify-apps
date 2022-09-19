import { Component } from '@angular/core';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
})
export class HomeComponent {
  redirectLoading = false;

  imageSourcesFolder = './../../assets/home-artist-albums/';
  availableImageSources = [
    'beyonce.png',
    'kendrick.png',
    'lorde.png',
    'miller.png',
    'taylor.png',
    'tyler.png',
  ];
  imageSource = // select any of the available sources
    this.imageSourcesFolder +
    this.availableImageSources[
      Math.floor(Math.random() * this.availableImageSources.length)
    ];

  constructor(private title: TitleService) {
    this.title.setTitle('Home');
  }
}
