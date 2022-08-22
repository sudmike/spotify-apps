import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';
import { ArtistFull } from '../entities/artist-full.entity';

export default class SubmitPlaylistSchema {
  @ApiHideProperty()
  @IsUUID()
  uuid: string;

  /**
   * Contains IDs of 'This is XYZ' playlists and their artists IDs and names
   */
  @IsArray()
  @ArrayMinSize(1)
  parts: ArtistFull[];
}
