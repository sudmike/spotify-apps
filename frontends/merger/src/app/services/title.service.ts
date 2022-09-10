import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { env } from '../../../env.dev';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private preTitle = env.name ?? 'No title';

  constructor(private title: Title) {}

  setTitle(name: string) {
    this.title.setTitle(`${this.preTitle} | ${name}`);
  }
}
