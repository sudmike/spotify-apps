import { Component, HostListener, Input, OnInit } from '@angular/core';
import { ArtistResponseFull } from '../../../../openapi';

export enum SongSplitType {
  equal,
  per_artist,
}

@Component({
  selector: 'app-config-pane',
  templateUrl: './config-pane.component.html',
  styleUrls: ['./config-pane.component.less'],
})
export class ConfigPaneComponent implements OnInit {
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
          artist.number = this.songsPerArtistEqual;
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
   * Checks that number input fields are numeric.
   * @param event The OnKeyDown event.
   */
  @HostListener('keydown', ['$event']) onKeyDown(event: Event) {
    const e = <KeyboardEvent>event;
    const keyCode = e.keyCode;
    if (
      [46, 8, 9, 27, 13, 110, 190].indexOf(keyCode) !== -1 ||
      // Allow: Ctrl+A
      (keyCode === 65 && (e.ctrlKey || e.metaKey)) ||
      // Allow: Ctrl+C
      (keyCode === 67 && (e.ctrlKey || e.metaKey)) ||
      // Allow: Ctrl+V
      (keyCode === 86 && (e.ctrlKey || e.metaKey)) ||
      // Allow: Ctrl+X
      (keyCode === 88 && (e.ctrlKey || e.metaKey)) ||
      // Allow: home, end, left, right
      (keyCode >= 35 && keyCode <= 39)
    ) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if (
      (e.shiftKey || keyCode < 48 || keyCode > 57) &&
      (keyCode < 96 || keyCode > 105)
    ) {
      e.preventDefault();
    }
  }
}
