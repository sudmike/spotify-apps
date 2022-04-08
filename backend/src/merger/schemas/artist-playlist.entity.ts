import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import ArtistEntity from './artist.entity';

export default class ArtistPlaylistEntity {
  /**
   * The ID of the 'This is XYZ' playlist.
   * @example 37i9dQZF1DZ06evO3nMr04
   */
  @IsString()
  @IsNotEmpty()
  playlist: string;

  /**
   * Contains the ID and name of the artist.
   */
  artist: ArtistEntity;

  /**
   * The number of songs that should be added from the artists 'This is XYZ' playlist.
   * @example 20
   */
  @IsNumber()
  @IsNotEmpty()
  number: number;
}
