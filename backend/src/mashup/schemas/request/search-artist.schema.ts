import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';

export default class SearchArtistSchema {
  @ApiHideProperty()
  @IsUUID()
  uuid: string;

  /**
   * The name of the artist to search
   * @example 'Kanye West'
   */
  @IsString()
  @IsNotEmpty()
  name: string;
}
