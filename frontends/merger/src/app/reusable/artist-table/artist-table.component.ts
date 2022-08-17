import { Component, Input, ViewChild } from '@angular/core';
import { ArtistResponseSimple } from '../../../openapi';
import { MatTable } from '@angular/material/table';

export enum TableMode {
  view,
  edit,
}

@Component({
  selector: 'app-artist-table',
  templateUrl: './artist-table.component.html',
  styleUrls: ['./artist-table.component.less'],
})
export class ArtistTableComponent {
  tableMode = TableMode; // so that HTML knows enum
  @Input() mode: TableMode = TableMode.view;
  @Input() artistData: {
    artist: ArtistResponseSimple;
    alternatives: ArtistResponseSimple[] | null;
  }[] = [];
  @ViewChild('table', { static: true, read: MatTable }) table: any;

  /**
   * Set mode of table to view-only or to edit.
   * @param mode Mode to set.
   */
  setMode(mode: TableMode) {
    this.mode = mode;
  }

  /**
   * Returns primary artists.
   */
  async getArtistData(): Promise<ArtistResponseSimple[]> {
    return this.artistData.map((data) => data.artist);
  }

  /**
   * Sets artist data.
   * @param data Tuples of artists and their possible alternative artists.
   */
  setArtistData(
    data: {
      artist: ArtistResponseSimple;
      alternatives: ArtistResponseSimple[] | null;
    }[],
  ) {
    console.log(data);
    this.artistData = data;
    this.renderTable();
  }

  /**
   * Adds an entry to the artist data.
   * @param data The tuple of artist and possible alternative artists.
   */
  addArtistToTable(data: {
    artist: ArtistResponseSimple;
    alternatives: ArtistResponseSimple[] | null;
  }) {
    this.artistData.push(data);
    this.renderTable();
  }

  /**
   * Checks if an artist is already part of artist data. Returns true if artist is already part and false if not.
   * @param artist The artist to check.
   */
  checkForArtist(artist: ArtistResponseSimple): boolean {
    return Boolean(
      this.artistData.find((data) => data.artist.id === artist.id),
    );
  }

  /**
   * Removes an entry from the artist data. Gets called on button press.
   * @param id The ID of the artist.
   */
  onRemoveArtist(id: string) {
    this.artistData = this.artistData.filter((data) => data.artist.id !== id);
    this.renderTable();
  }

  /**
   * Restructures artist data by switching an artist with an alternative artist. Gets called on button press.
   * @param id The ID of the artist that should be replaced.
   * @param alternative The ID of the artist that is the replacement.
   */
  async onChangeToAlternative(id: string, alternative: string) {
    if (this.artistData.find((data) => data.artist.id === alternative)) {
      // ... handle error that artist is already selected
      return;
    }

    const entry = this.artistData.find((data) => data.artist.id === id);
    const main = entry?.artist;
    const sub = entry?.alternatives?.find((alt) => alt.id === alternative);

    if (!main || !sub) {
      // ... handle error that the change failed
    } else {
      this.artistData.map((data) => {
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
   * Renders the artist-table. Function should be called after modifying data.
   * @private
   */
  private renderTable() {
    this.table.renderRows();
  }
}
