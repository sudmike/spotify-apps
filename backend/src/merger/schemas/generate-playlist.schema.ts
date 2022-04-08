import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';
import ArtistPlaylistEntity from './artist-playlist.entity';

export default class GeneratePlaylistSchema {
  @ApiHideProperty()
  @IsUUID()
  uuid: string;

  @IsArray()
  @ArrayMinSize(1)
  parts: ArtistPlaylistEntity[];
}
