import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsUUID,
} from 'class-validator';
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

  /**
   * Defines if playlist refreshing is set to active or not
   * @example true
   */
  @IsBoolean()
  active: boolean;

  /**
   * Refresh playlist every X days
   * @example 7
   */
  @IsNumber()
  frequency: number;
}
