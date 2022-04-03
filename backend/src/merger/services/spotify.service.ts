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
   * Returns the artist that matches the requested artist name.
   * @param artist THe name of the artist to return results for.
   */
  async searchArtist(artist: string) {
    try {
      const res = (
        await super.getSpotifyApi().searchArtists(artist, { limit: 1 })
      ).body.artists;
      const entry = res.items.at(0);
      const more: null | number = res.next ? 1 : null;

      // check for 'This is XYZ' playlist
      const playlist = await this.getThisIsPlaylistId(entry?.name); //abuse
      if (!entry || !playlist)
        return { query: artist, alternatives: more, artist: null };

      entry.href = playlist;

      return {
        query: artist,
        next: more,
        artist: {
          id: entry.id,
          name: entry.name,
          images: entry.images.map((image) => image.url),
          popularity: entry.popularity,
          playlist: entry.href,
        },
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Returns up to 5 artists that fit the requested artist name.
   * @param artist The name of the artist to return results for.
   * @param offset The offset to the last request to get new results.
   */
  async searchArtistAlternatives(artist: string, offset = 0) {
    try {
      const limit = 10;
      const res = (
        await super.getSpotifyApi().searchArtists(artist, { limit, offset })
      ).body.artists;
      const entries = res.items;
      let more: null | number = res.next ? offset : null;

      // filter out artists that don't have a 'This is XYZ' playlist
      const validEntries = [];
      for await (const [index, entry] of entries.entries()) {
        if (more !== null) more = offset + index + 1;

        const playlistId = await this.getThisIsPlaylistId(entry.name);
        if (playlistId) {
          entry.href = playlistId; // abuse
          validEntries.push(entry);
          if (validEntries.length >= 5) break;
        }
      }

      return {
        query: artist,
        next: more,
        artists: validEntries.map((entry) => ({
          id: entry.id,
          name: entry.name,
          images: entry.images.map((image) => image.url),
          popularity: entry.popularity,
          playlist: entry.href,
        })),
      };
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
    if (!artist) return undefined;

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
