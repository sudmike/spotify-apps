import { ArtistFull } from './artist-full.entity';

export class ArtistResponseFull extends ArtistFull {
  /**
   * Array of URLs to artist images
   */
  images: string[];
}
