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
        this.table.renderRows();

        // reset the input field
        this.searchArtist = '';
      }
    } catch (e) {
      // ... handle failed artist search
    }
  }
}
