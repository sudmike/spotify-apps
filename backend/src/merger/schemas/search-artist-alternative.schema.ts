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

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @IsPositive()
  offset: number;
}
