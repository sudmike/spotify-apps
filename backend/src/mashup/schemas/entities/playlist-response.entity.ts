export class PlaylistsResponse {
  /**
   * The name of the playlist
   * @example 'These are Labrinth, Sia and Diplo'
   */
  name: string;

  /**
   * The description of the playlist
   * @example 'This playlist was created with mashup-music.com! Artists are Diplo, Labrinth and Sia.'
   */
  description: string;

  /**
   * Array of URLs to playlist images
   */
  images: string[];
}
