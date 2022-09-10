import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { ArtistResponseFull, PlaylistsResponse } from '../../openapi';
import { EditComponent } from '../reusable/edit/edit.component';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.less'],
})
export class PlaylistComponent implements OnInit {
  id: string | undefined;
  playlist: PlaylistsResponse | undefined;
  artists: ArtistResponseFull[] = [];
  saveLoading = false;
  @ViewChild(EditComponent) edit!: EditComponent;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private notification: NotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.getPlaylistData();
  }

  /**
   * Saves changes from edit. Gets called on button press.
   */
  async onSave() {
    if (!this.id) return;
    this.saveLoading = true;
    try {
      const artists: ArtistResponseFull[] = await this.edit.getArtistData();
      await this.api.updatePlaylist(this.id, artists);
      this.notification.success('Saved changes to playlist');
    } catch (e) {
      this.notification.warning('Failed to save changes');
    }

    this.saveLoading = false;

    await this.getPlaylistData();
  }

  /**
   * Fetches data for playlist from backend.
   */
  async getPlaylistData() {
    this.route.params.subscribe(async (params) => {
      const id = params['id'];

      if (id) {
        try {
          const res = await this.api.getPlaylist(id);
          this.id = res.id;
          this.playlist = res.playlist;
          this.artists = res.artists;
        } catch (e) {
          this.notification.warning('Failed to get playlist data');
        }
      }
    });
  }
}
