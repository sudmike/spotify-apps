import { Component, Input, OnInit } from '@angular/core';
import { GetPlaylistResponseSchema } from '../../../openapi';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard-playlist',
  templateUrl: './dashboard-playlist.component.html',
  styleUrls: ['./dashboard-playlist.component.less'],
})
export class DashboardPlaylistComponent implements OnInit {
  @Input() data!: GetPlaylistResponseSchema;
  regenerateLoading = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {}

  async regeneratePlaylist(): Promise<void> {
    this.regenerateLoading = true;
    try {
      await this.api.regeneratePlaylist(this.data.id);
      await this.refresh();
      this.regenerateLoading = false;
    } catch (e) {
      // ... handle failed regeneration
    }
  }

  async refresh() {
    if (this.data) {
      try {
        this.data = await this.api.getPlaylist(this.data.id);
      } catch (e) {
        // ... handle failed refresh
      }
    }
  }
}
