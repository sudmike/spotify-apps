import { Injectable } from '@nestjs/common';
import { ISpotifyService } from '../../services/ISpotify.service';
import {
  generatePlaylistDescription,
  generatePlaylistTitle,
  shuffleArray,
  trimTrackSelection,
} from './generation.helper';

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
   * Generates a Spotify playlist.
   * @param entries Information about playlists that the generation is based on etc.
   */
  async generatePlaylist(entries: PlaylistEntries[]) {
    try {
      const artists = entries.map((entry) => entry.artist.name);
      const title = generatePlaylistTitle(artists);
      const description = generatePlaylistDescription(artists);
      const tracks = await this.generateTrackList(entries);

      const res = await this.getSpotifyApi().createPlaylist(title, {
        description,
      });
      const playlistId = res.body.id;

      await this.addTracksToPlaylist(playlistId, tracks);

      return playlistId;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Returns a list of song IDs that are extracted from the playlists which are passed.
   * @param playlistEntries These contain the IDs of playlists and the number of songs that should be extracted.
   * @private
   */
  private async generateTrackList(playlistEntries: PlaylistEntries[]) {
    let tracks = [];

    try {
      // go through each playlist and get tracks
      for await (const chunk of playlistEntries) {
        // get tracks from playlist
        const tracksSubset = await this.getTracksFromPlaylist(chunk.playlist);

        // filter tracks and add them to array
        tracks = tracks.concat(trimTrackSelection(tracksSubset, chunk.number));
      }

      return shuffleArray(tracks);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Returns all tracks from a playlist.
   * @param id The ID of the playlist.
   * @private
   */
  private async getTracksFromPlaylist(id: string) {
    try {
      let tracks: string[] = [];
      let remaining: number;

      // get tracks batch by batch
      do {
        const playlist = (
          await this.getSpotifyApi().getPlaylistTracks(id, {
            offset: tracks.length,
          })
        ).body;
        remaining = playlist.total - playlist.offset - playlist.limit;
        tracks = tracks.concat(playlist.items.map((item) => item.track.uri));
      } while (remaining > 0);

      return tracks;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Adds tracks to a playlist.
   * @param id The ID of the playlist.
   * @param tracks The IDs of the tracks that should be added.
   * @private
   */
  private async addTracksToPlaylist(id: string, tracks: string[]) {
    try {
      while (tracks.length > 0) {
        const batch = tracks.splice(0, 100);
        await this.getSpotifyApi().addTracksToPlaylist(id, batch);
      }
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

export type PlaylistEntries = {
  playlist: string;
  artist: {
    id: string;
    name: string;
  };
  number: number;
};
