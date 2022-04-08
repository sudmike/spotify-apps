import { IsNotEmpty, IsString } from 'class-validator';

export default class ArtistEntity {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
