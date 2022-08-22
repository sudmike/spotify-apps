import { PlaylistsResponse } from '../entities/playlist-response.entity';
import { ArtistResponseFull } from '../entities/artist-response-full.entity';

export class GetPlaylistResponseSchema {
  /**
   * The ID of the playlist
   * @example 7EHw08q3YBIvG9iGI7Q9Ob
   */
  id: string;

  /**
   * Defines if the playlist is set to active or not
   * @example true
   */
  active: boolean;

  playlist: PlaylistsResponse;

  artists: ArtistResponseFull[];
}
