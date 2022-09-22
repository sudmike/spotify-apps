import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ActivatedRoute } from '@angular/router';
import {
  ArtistResponseFull,
  MetadataResponse,
  PlaylistsResponse,
} from '../../openapi';
import { EditComponent } from '../reusable/edit/edit.component';
import { NotificationService } from '../services/notification.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.less'],
})
export class PlaylistComponent implements OnInit {
  id: string | undefined;
  playlist: PlaylistsResponse | undefined;
  artists: ArtistResponseFull[] = [];
  initialArtists: ArtistResponseFull[] = [];
  metadata: MetadataResponse = {
    updated: 0,
    created: 0,
    active: true,
    frequency: 7,
  };
  saveLoading = false;
  @ViewChild(EditComponent) edit!: EditComponent;

  constructor(
    private title: TitleService,
    private api: ApiService,
    private route: ActivatedRoute,
    private notification: NotificationService,
  ) {
    this.title.setTitle('Loading...');
  }

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
      this.artists = this.edit.getArtistData();
      const active: boolean = this.edit.getActive();
      const frequency: number = this.edit.getFrequency();
      const updateTitle = this.shouldTitleChange();
      const updateDescription = this.shouldDescriptionChange();
      const updateSongs = this.shouldSongsChange();
      const updateMetadata = this.hasMetadataChanged(active, frequency);

      if (
        this.artists.length > 0 &&
        !isNaN(frequency) &&
        (updateTitle || updateDescription || updateSongs || updateMetadata)
      ) {
        await this.api.updatePlaylist(
          this.id,
          this.artists,
          active,
          frequency,
          updateTitle,
          updateDescription,
          updateSongs,
          updateMetadata,
        );
        this.notification.success('Saved changes to playlist');
        await this.getPlaylistData();
      }
    } catch (e) {
      this.notification.warning('Failed to save changes');
    }

    this.saveLoading = false;
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
          this.setInitialArtists(res.artists);
          this.metadata = res.metadata;
          this.title.setTitle(res.playlist.name);
        } catch (e) {
          this.notification.warning('Failed to get playlist data');
        }
      }
    });
  }

  /**
   * Checks if the playlists title needs to be changed.
   * @private
   */
  private shouldTitleChange() {
    const artistOrderChanged = this.hasArtistOrderChanged();
    const isDefaultTitle = this.playlist?.name.includes('These are ');
    return artistOrderChanged && Boolean(isDefaultTitle);
  }

  /**
   * Checks if the playlists description needs to be changed.
   * @private
   */
  private shouldDescriptionChange() {
    const artistOrderChanged = this.hasArtistOrderChanged();
    const isDefaultDescription = this.playlist?.description
      .toLowerCase()
      .includes('this playlist was auto-generated! artists are ');
    return artistOrderChanged && Boolean(isDefaultDescription);
  }

  /**
   * Sets initial artists by copying instead of referencing.
   * @param artists The value that should be set to variable initial artists.
   * @private
   */
  private setInitialArtists(artists: ArtistResponseFull[]) {
    this.initialArtists = JSON.parse(JSON.stringify(artists));
  }

  /**
   * Checks if the playlists songs need to be changed.
   * @private
   */
  private shouldSongsChange() {
    return this.hasArtistSongNumberChanged();
  }

  /**
   * Checks if the playlists metadata has changed.
   * @param active Value of active that should be compared to original metadata.
   * @param frequency Value of frequency that should be compared to original metadata.
   * @private
   */
  private hasMetadataChanged(active: boolean, frequency: number) {
    return (
      active !== this.metadata.active || frequency !== this.metadata.frequency
    );
  }

  /**
   * Checks if the order of artists have changed compared to the initial artists.
   * @private
   */
  private hasArtistOrderChanged() {
    return (
      this.artists.length !== this.initialArtists.length ||
      !this.artists.every(
        (artist, index) => artist.id === this.initialArtists[index]?.id,
      )
    );
  }

  /**
   * Checks if the number of songs per artist have changed compared to the initial artists, disregarding their order.
   * @private
   */
  private hasArtistSongNumberChanged() {
    return (
      this.artists.length !== this.initialArtists.length ||
      !this.artists.every((artist) => {
        const initialArtist = this.initialArtists.find(
          (initialArtist) => initialArtist.name === artist.name,
        );
        return initialArtist ? artist.number === initialArtist.number : false;
      })
    );
  }
}
