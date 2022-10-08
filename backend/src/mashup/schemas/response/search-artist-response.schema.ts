import { ArtistResponseFull } from '../entities/artist-response-full.entity';

export class SearchArtistResponseSchema {
  /**
   * The search query
   * @example Ye
   */
  query: string;

  /**
   * The reason in case a search fails
   * @example Could not find artist
   */
  errorReason: string | null;

  /**
   * The artist that is returned
   */
  artist: ArtistResponseFull | null;
}
