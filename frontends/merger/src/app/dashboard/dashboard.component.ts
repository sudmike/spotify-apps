import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { GetPlaylistResponseSchema } from '../../openapi';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
  playlists: GetPlaylistResponseSchema[] = [];

  constructor(
    private api: ApiService,
    private notification: NotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.playlists = await this.api.getPlaylists();
    } catch (e) {
      this.notification.error('Failed to load playlists');
    }
  }
}
