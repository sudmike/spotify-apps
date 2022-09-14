import { Component, Input, ViewChild } from '@angular/core';
import { ArtistResponseFull } from '../../../openapi';
import { ArtistPaneComponent } from './artist-pane/artist-pane.component';
import { ConfigPaneComponent } from './config-pane/config-pane.component';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { SongNumberPaneComponent } from './song-number-pane/song-number-pane.component';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.less'],
})
export class EditComponent {
  @Input() artists: ArtistResponseFull[] = []; // only at beginning
  @Input() active!: boolean;
  @Input() frequency!: number;
  @ViewChild(ArtistPaneComponent) table!: ArtistPaneComponent;
  @ViewChild(ConfigPaneComponent) config!: ConfigPaneComponent;
  @ViewChild(SongNumberPaneComponent) songNumber!: SongNumberPaneComponent;

  searchArtist = '';
  searchLoading = false;

  constructor(
    private api: ApiService,
    private notification: NotificationService,
  ) {}

  /**
   * Gets triggered when artists change in artist table.
   * @param artists The new list of artists.
   */
  onArtistChange(artists: ArtistResponseFull[]) {
    this.songNumber.setArtists(artists);
  }

  /**
   * Returns artists from artist table.
   */
  getArtistData(): ArtistResponseFull[] {
    let artists = this.songNumber.getArtists();

    // sanitize artists
    artists = artists.filter((artist) => artist.number > 0);
    artists = artists.map((artist) => ({
      ...artist,
      number: (artist.number = artist.number <= 100 ? artist.number : 100),
    }));

    // check if all requirements are fulfilled
    if (artists.length < 2) {
      this.notification.warning('At least two artists need to be included');
      return [];
    }

    return this.songNumber.getArtists();
  }

  /**
   * Returns if playlist refreshing is set to active in config pane.
   */
  getActive(): boolean {
    return this.config.getActive();
  }

  /**
   * Returns playlist refreshing frequency from config pane.
   */
  getFrequency(): number {
    return this.config.getFrequency();
  }

  /**
   * Searches for an artist and adds the artist to artist data if found.
   */
  async onSearchArtist() {
    // skip requests if the last one is still loading
    if (this.searchLoading || !this.searchArtist) return;

    this.searchLoading = true;
    try {
      const res = await this.api.searchArtist(this.searchArtist);

      if (!res.artist) {
        this.notification.warning('Could not find valid artist');
      } else if (this.table.checkForArtist(res.artist)) {
        this.notification.warning('Artist is already selected');
      } else {
        this.table.addArtistToTable(res.artist);

        // reset the input field
        this.searchArtist = '';
      }
    } catch (e) {
      this.notification.error('Failed to search for artist');
    }
    this.searchLoading = false;
  }
}
