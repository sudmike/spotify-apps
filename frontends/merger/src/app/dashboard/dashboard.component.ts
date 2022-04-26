import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { GetPlaylistResponseSchema } from '../../openapi';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
  playlists: GetPlaylistResponseSchema[] = [];

  constructor(private api: ApiService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.playlists = await this.api.getPlaylists();
    } catch (e) {
      // ... handle failed fetching of playlists
    }
  }
}
