import { ArtistResponseSimple } from './artist-response-simple.entity';

export class ArtistResponse extends ArtistResponseSimple {
  /**
   * Popularity score of the artist
   * @example 91
   */
  popularity: number;
}
