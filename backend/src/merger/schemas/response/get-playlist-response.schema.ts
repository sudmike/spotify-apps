import { PlaylistsResponse } from '../entities/playlist-response.entity';
import { ArtistResponse } from '../entities/artist-response.entity';

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

  artists: ArtistResponse[];
}
