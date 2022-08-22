import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatTable } from '@angular/material/table';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { ArtistResponseFull } from '../../../../openapi';

@Component({
  selector: 'app-artist-pane',
  templateUrl: './artist-pane.component.html',
  styleUrls: ['./artist-pane.component.less'],
})
export class ArtistPaneComponent {
  @Input() artists: ArtistResponseFull[] = [];
  @Output() artistChange = new EventEmitter<ArtistResponseFull[]>();
  @ViewChild(MatTable) table!: MatTable<any>;

  /**
   * Adds an entry to the artist data.
   * @param artist The artist to add.
   */
  addArtistToTable(artist: ArtistResponseFull) {
    this.artists.push(artist);
    this.updateTable();
  }

  /**
   * Checks if an artist is already part of artist data. Returns true if artist is already part and false if not.
   * @param artist The artist to check.
   */
  checkForArtist(artist: ArtistResponseFull): boolean {
    return Boolean(this.artists.find((a) => a.id === artist.id));
  }

  /**
   * Removes an entry from the artist data. Gets called on button press.
   * @param id The ID of the artist.
   */
  onRemoveArtist(id: string) {
    this.artists = this.artists.filter((a) => a.id !== id);
    this.updateTable();
  }

  /**
   * Moves position of artist in table. Gets called on button press.
   * @param positionFrom The position of the entry that should be moved.
   * @param positionTo The position of where the entry should be moved to.
   */
  onMoveArtist(positionFrom: number, positionTo: number) {
    if (positionTo < 0 || positionTo > this.artists.length) return;
    moveItemInArray(this.artists, positionFrom, positionTo);
    this.updateTable();
  }

  /**
   * Renders the artist-table and emits event that artists have changed. Function should be called after modifying data.
   * @private
   */
  private updateTable() {
    this.artistChange.emit(this.getArtists());
    this.table.renderRows();
  }

  /**
   * Returns artists.
   * @private
   */
  private getArtists(): ArtistResponseFull[] {
    return this.artists;
  }
}
