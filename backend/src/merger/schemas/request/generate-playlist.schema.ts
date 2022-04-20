import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';
import ArtistPlaylistEntity from '../entities/artist-playlist.entity';

export default class GeneratePlaylistSchema {
  @ApiHideProperty()
  @IsUUID()
  uuid: string;

  /**
   * Contains IDs of 'This is XYZ' playlists and their artists IDs and names
   */
  @IsArray()
  @ArrayMinSize(1)
  parts: ArtistPlaylistEntity[];
}
