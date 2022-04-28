import { Component, OnInit, ViewChild } from '@angular/core';
import { ArtistResponse } from 'src/openapi';
import { ApiService } from '../services/api.service';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.less'],
})
export class CreateComponent implements OnInit {
  searchArtist = '';
  artistTableData: {
    artist: ArtistResponse;
    alternatives: ArtistResponse[] | null;
  }[] = [];
  @ViewChild('table', { static: true, read: MatTable }) table: any;

  constructor(private api: ApiService) {}

  ngOnInit(): void {}

  /**
   * Searches for an artist and adds the artist to artist table data if found.
   */
  async onSearchArtist() {
    try {
      const res = await this.api.searchArtist(this.searchArtist);

      if (!res.artist) {
        // ... handle no valid artist found
      } else {
        this.artistTableData.push({
          artist: res.artist,
          alternatives: res.next
            ? (await this.api.searchArtistAlternatives(res.query)).artists
            : null,
        });
        this.renderTable();

        // reset the input field
        this.searchArtist = '';
      }
    } catch (e) {
      // ... handle failed artist search
    }
  }

  /**
   * Removes an entry from the artist table data. Gets called on button press.
   * @param id The ID of the artist.
   */
  onRemoveArtist(id: string) {
    this.artistTableData = this.artistTableData.filter(
      (data) => data.artist.id !== id,
    );
    this.renderTable();
  }

  /**
   * Restructures artist data by switching an artist with an alternative artist. Gets called on button press.
   * @param id The ID of the artist that should be replaced.
   * @param alternative The ID of the artist that is the replacement.
   */
  async onChangeToAlternative(id: string, alternative: string) {
    const entry = this.artistTableData.find((data) => data.artist.id === id);
    const main = entry?.artist;
    const sub = entry?.alternatives?.find((alt) => alt.id === alternative);

    if (!main || !sub) {
      // ... handle error that the change failed
    } else {
      this.artistTableData.map((data) => {
        // replace the artist only on the related entry
        if (data.artist.id === id) {
          data.artist = sub;
          data.alternatives?.splice(
            data.alternatives?.findIndex((alt) => alt.id === sub.id),
            1,
            main,
          );
        }
        return data;
      });

      this.renderTable();
    }
  }

  /**
   * Renders the table. Function needs to be called after modifying table data.
   * @private
   */
  private renderTable() {
    this.table.renderRows();
  }
}
