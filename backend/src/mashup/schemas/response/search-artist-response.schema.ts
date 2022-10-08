import { ArtistResponseFull } from '../entities/artist-response-full.entity';

export class SearchArtistResponseSchema {
  /**
   * The search query
   * @example Ye
   */
  query: string;

  /**
   * The artist that is returned
   */
  artist: ArtistResponseFull | null;
}
