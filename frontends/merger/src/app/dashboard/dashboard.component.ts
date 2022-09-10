import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { GetPlaylistResponseSchema } from '../../openapi';
import { NotificationService } from '../services/notification.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
  state: 'loading' | 'empty' | 'ready' | 'error' = 'loading';
  playlists: GetPlaylistResponseSchema[] = [];

  constructor(
    private title: TitleService,
    private api: ApiService,
    private notification: NotificationService,
  ) {
    this.title.setTitle('Dashboard');
  }

  async ngOnInit(): Promise<void> {
    try {
      this.playlists = await this.api.getPlaylists();
      this.state = this.playlists.length === 0 ? 'empty' : 'ready';
    } catch (e) {
      this.notification.error('Failed to load playlists');
      this.state = 'error';
    }
  }
}
