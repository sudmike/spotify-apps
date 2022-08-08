export class ArtistResponseSimple {
  /**
   * The ID of the artist
   * @example 5K4W6rqBFWDnAN6FQUkS6x
   */
  id: string;

  /**
   * The name of the artist
   * @example 'Kanye West'
   */
  name: string;

  /**
   * Array of URLs to artist images
   */
  images: string[];

  /**
   * The ID of the 'This is XYZ' playlist
   * @example 37i9dQZF1DZ06evO3nMr04
   */
  playlist: string;
}
