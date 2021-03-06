import { ArtistResponse } from '../entities/artist-response.entity';

export class SearchArtistResponseSchema {
  /**
   * The search query
   * @example Ye
   */
  query: string;

  /**
   * Offset to the next artist batch
   * @example 10
   */
  next: number | null;

  /**
   * The artist that is returned
   */
  artist: ArtistResponse | null;
}
