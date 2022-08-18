import { Component, Input, ViewChild } from '@angular/core';
import { ArtistResponseSimple } from '../../../openapi';
import { ArtistPaneComponent } from './artist-pane/artist-pane.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.less'],
})
export class EditComponent {
  @Input() artistData: ArtistResponseSimple[] = [];
  @ViewChild(ArtistPaneComponent) table!: ArtistPaneComponent;

  searchArtist = '';
  searchLoading = false;

  constructor(private api: ApiService) {}

  /**
   * Returns artists from artist table.
   */
  async getArtistData(): Promise<ArtistResponseSimple[]> {
    return this.table.getArtistData();
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
        // ... handle no valid artist found
      } else if (this.table.checkForArtist(res.artist)) {
        // ... handle artist already there
      } else {
        this.table.addArtistToTable({
          artist: res.artist,
          alternatives: res.next
            ? (await this.api.searchArtistAlternatives(res.query)).artists
            : null,
        });

        // reset the input field
        this.searchArtist = '';
      }
    } catch (e) {
      // ... handle failed artist search
    }
    this.searchLoading = false;
  }
}
