import { IsNotEmpty, IsString } from 'class-validator';

export default class ArtistEntity {
  /**
   * The ID of the artist.
   * @example 5K4W6rqBFWDnAN6FQUkS6x
   */
  @IsString()
  @IsNotEmpty()
  id: string;

  /**
   * The name of the artist.
   * @example Kanye West
   */
  @IsString()
  @IsNotEmpty()
  name: string;
}
