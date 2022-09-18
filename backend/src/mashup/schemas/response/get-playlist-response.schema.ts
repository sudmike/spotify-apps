import { PlaylistsResponse } from '../entities/playlist-response.entity';
import { ArtistResponseFull } from '../entities/artist-response-full.entity';
import { MetadataResponse } from '../entities/metadata-response.entity';

export class GetPlaylistResponseSchema {
  /**
   * The ID of the playlist
   * @example 7EHw08q3YBIvG9iGI7Q9Ob
   */
  id: string;

  playlist: PlaylistsResponse;

  artists: ArtistResponseFull[];

  metadata: MetadataResponse;
}
