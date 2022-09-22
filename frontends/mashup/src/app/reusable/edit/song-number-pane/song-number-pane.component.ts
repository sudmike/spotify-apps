import { Component, Input, OnInit } from '@angular/core';
import { ArtistResponseFull } from '../../../../openapi';
import { SongSplitType } from '../config-pane/config-pane.component';

@Component({
  selector: 'app-song-number-pane',
  templateUrl: './song-number-pane.component.html',
  styleUrls: ['./song-number-pane.component.less'],
})
export class SongNumberPaneComponent implements OnInit {
  @Input() artists: ArtistResponseFull[] = [];
  tabType: SongSplitType = SongSplitType.equal;

  songsPerArtistEqual = 20;

  ngOnInit() {
    this.tabType = this.artists
      .map((artist) => artist.number)
      .every((val, i, arr) => val === arr[0])
      ? SongSplitType.equal
      : SongSplitType.per_artist;

    if (this.tabType === SongSplitType.equal && this.artists.length > 0) {
      this.songsPerArtistEqual = this.artists[0].number;
    }
  }

  /**
   * Gets triggered when artists change in artist table. The new artist list is compared to the old artist list.
   * @param artists The new list of artists.
   */
  setArtists(artists: ArtistResponseFull[]) {
    this.artists = artists.map((artist) => {
      const foundArtist = this.artists.find((a) => a.id === artist.id);
      return foundArtist && foundArtist.number
        ? foundArtist
        : { ...artist, number: this.songsPerArtistEqual };
    });
  }

  /**
   * Returns artists and the number of songs for each artist.
   */
  getArtists() {
    switch (this.tabType) {
      case SongSplitType.equal:
        this.artists = this.artists.map((artist) => {
          artist.number = +this.songsPerArtistEqual;
          return artist;
        });
        break;
      default:
        break;
    }
    return this.artists;
  }

  /**
   * Calculates total number of songs based on artist-song-split-type.
   */
  calculateTotal() {
    switch (this.tabType) {
      case SongSplitType.equal:
        return this.artists.length * this.songsPerArtistEqual;
      case SongSplitType.per_artist:
        return this.artists
          .map((artist) => artist.number)
          .reduce((a, b) => a + b, 0);
      default:
        return 42;
    }
  }

  /**
   * Change the number of songs for each artist when the equals slider changes and the number of songs per artist are already the same.
   * Gets called when value of slider in equal tab changes.
   */
  onEqualSliderChange() {
    if (this.artists.length > 0) {
      const comparisonNumber = this.artists[0].number;

      if (this.artists.every((artist) => artist.number === comparisonNumber)) {
        this.artists = this.artists.map((artist) => ({
          ...artist,
          number: this.songsPerArtistEqual,
        }));
      }
    }
  }
}
