import { Injectable } from '@nestjs/common';
import { ISpotifyService } from '../../services/ISpotify.service';

@Injectable()
export class SpotifyService extends ISpotifyService {
  constructor() {
    const spotifyCredentials = {
      clientId: process.env.SPOTIFY_CLIENT_ID_MERGER,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET_MERGER,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI_MERGER,
    };

    super(spotifyCredentials);
  }

  /**
   * Returns up to 5 artists that fit the requested artist name.
   * @param artist The name of the artist to return results for.
   */
  async searchArtist(artist: string) {
    try {
      const res = (
        await super.getSpotifyApi().searchArtists(artist, { limit: 5 })
      ).body.artists.items;

      return res.map((entry) => ({
        id: entry.id,
        name: entry.name,
        images: entry.images.map((image) => image.url),
        popularity: entry.popularity,
      }));
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
