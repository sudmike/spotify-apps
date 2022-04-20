import { ArtistResponseSimple } from './artist-response-simple.entity';

export class ArtistResponse extends ArtistResponseSimple {
  /**
   * Popularity score of the artist
   * @example 91
   */
  popularity: number;

  /**
   * The ID of the 'This is XYZ' playlist
   * @example 37i9dQZF1DZ06evO3nMr04
   */
  playlist: string;
}
