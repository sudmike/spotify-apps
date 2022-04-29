import { Component, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ArtistTableComponent } from '../reusable/artist-table/artist-table.component';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.less'],
})
export class CreateComponent {
  searchArtist = '';
  @ViewChild(ArtistTableComponent) table: any;

  constructor(private api: ApiService) {}

  /**
   * Searches for an artist and adds the artist to artist data if found.
   */
  async onSearchArtist() {
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
  }

  /**
   * Submits playlist to be generated. Gets called on button press.
   */
  async onSubmit() {
    try {
      const artists = this.table.getArtistData();
      await this.api.submitPlaylist(artists);
      // ... notify about success
      this.table.setArtistData([]);
    } catch (e) {
      // ... handle error that the playlist could not be generated
    }
  }
}
