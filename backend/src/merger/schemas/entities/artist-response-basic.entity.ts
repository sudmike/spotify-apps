import ArtistBasic from './artist-basic.entity';

export class ArtistResponseBasic extends ArtistBasic {
  /**
   * Array of URLs to artist images
   */
  images: string[];
}
