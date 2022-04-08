import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';

export default class SearchArtistSchema {
  @ApiHideProperty()
  @IsUUID()
  uuid: string;

  @IsString()
  @IsNotEmpty()
  id: string;
}
