import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import ArtistEntity from './artist.entity';

export default class ArtistPlaylistEntity {
  @IsString()
  @IsNotEmpty()
  playlist: string;

  artist: ArtistEntity;

  @IsNumber()
  @IsNotEmpty()
  number: number;
}
