import { Component, Input } from '@angular/core';
import { GetPlaylistResponseSchema } from '../../../openapi';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard-playlist',
  templateUrl: './dashboard-playlist.component.html',
  styleUrls: ['./dashboard-playlist.component.less'],
})
export class DashboardPlaylistComponent {
  @Input() data!: GetPlaylistResponseSchema;
  regenerateLoading = false;

  constructor(
    private api: ApiService,
    private notification: NotificationService,
  ) {}

  async regeneratePlaylist(): Promise<void> {
    this.regenerateLoading = true;
    try {
      await this.api.regeneratePlaylist(this.data.id);
      await this.refresh();
      this.notification.starry('Regenerated songs in playlist');
      this.regenerateLoading = false;
    } catch (e) {
      this.notification.error('Failed to regenerate playlist');
      this.regenerateLoading = false;
    }
  }

  async refresh() {
    if (this.data) {
      try {
        this.data = await this.api.getPlaylist(this.data.id);
      } catch (e) {
        this.notification.warning('Failed to refresh dashboard page');
      }
    }
  }
}
