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

      // filter out artists that don't have a 'This is XYZ' playlist
      const validEntries = [];
      for await (const entry of res) {
        const playlistId = await this.getThisIsPlaylistId(entry.name);
        if (playlistId) {
          entry.href = playlistId; // abuse
          validEntries.push(entry);
        }
      }

      return validEntries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        images: entry.images.map((image) => image.url),
        popularity: entry.popularity,
        playlist: entry.href,
      }));
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Returns the id of an artists 'This is XYZ' playlist or undefined if there is none.
   * @param artist The name of the artist.
   * @private
   */
  private async getThisIsPlaylistId(artist: string) {
    try {
      const res = (
        await super
          .getSpotifyApi()
          .searchPlaylists('This is ' + artist, { limit: 1 })
      ).body.playlists.items?.at(0);

      if (res?.owner.id === 'spotify') return res.id || undefined;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
