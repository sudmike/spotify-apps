import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';

export default class SearchArtistAlternativesSchema {
  @ApiHideProperty()
  @IsUUID()
  uuid: string;

  /**
   * The name of the artist to search.
   * @example Kanye West
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * The offset for viable artists.
   * @example 0
   */
  @IsNumber()
  @IsPositive()
  offset: number;
}
