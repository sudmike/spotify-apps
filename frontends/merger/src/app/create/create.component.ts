import { Component, OnInit, ViewChild } from '@angular/core';
import { SearchArtistResponseSchema } from 'src/openapi';
import { ApiService } from '../services/api.service';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.less'],
})
export class CreateComponent implements OnInit {
  searchArtist = '';
  artistResponses: SearchArtistResponseSchema[] = [];
  artistTableData: { id: string; name: string; image: string }[] = [];
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
        this.artistResponses.push(res);
        this.artistTableData.push({
          id: res.artist.id,
          name: res.artist.name,
          image: res.artist.images[2],
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
    this.artistResponses = this.artistResponses.filter(
      (res) => res.artist?.id !== id,
    );
    this.artistTableData = this.artistTableData.filter(
      (data) => data.id !== id,
    );
    this.renderTable();
  }

  /**
   * Renders the table. Function needs to be called after modifying table data.
   * @private
   */
  private renderTable() {
    this.table.renderRows();
  }
}
