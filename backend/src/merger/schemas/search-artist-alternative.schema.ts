import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
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
  @Type(() => Number)
  offset: number;
}
