import ArtistBasic from './artist-basic.entity';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ArtistFull extends ArtistBasic {
  /**
   * Number of songs to select from the artist
   * @example 25
   */
  @IsNumber()
  @IsNotEmpty()
  number: number;

  /**
   * The ID of the 'This is XYZ' playlist
   * @example 37i9dQZF1DZ06evO3nMr04
   */
  @IsString()
  @IsNotEmpty()
  playlist: string;
}
