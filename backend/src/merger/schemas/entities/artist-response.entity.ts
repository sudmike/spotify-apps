import { ArtistResponseSimple } from './artist-response-simple.entity';

export class ArtistResponse extends ArtistResponseSimple {
  /**
   * Number of songs to select from the artist
   * @example 25
   */
  number: number;
}
