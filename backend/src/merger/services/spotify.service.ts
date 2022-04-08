import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ISpotifyService } from '../../services/ISpotify.service';
import {
  generatePlaylistDescription,
  generatePlaylistTitle,
  shuffleArray,
  trimTrackSelection,
} from './generation.helper';
import ArtistPlaylistEntity from '../schemas/artist-playlist.entity';

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
   * @param artist The name of the artist to return results for.
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
   * Returns details about the requested playlists.
   * @param ids The IDs of the playlists.
   * @param onDeleted Handler for when a playlist has been deleted.
   */
  async getPlaylistDetails(ids: string[], onDeleted?: (playlist) => void) {
    const username = await ISpotifyService.getUsername(this.getSpotifyApi());
    const playlists: {
      id: string;
      details: { name: string; description: string; images: string[] };
    }[] = [];

    try {
      // fetch playlists one by one
      for await (const id of ids) {
        const playlist = (
          await this.getSpotifyApi().getPlaylist(id, {
            fields: 'id,name,description,images,owner(id)',
          })
        ).body;

        (await this.getPlaylistFollowingStatus(id, username))
          ? playlists.push({
              id,
              details: {
                name: playlist.name,
                description: playlist.description,
                images: playlist.images.map((image) => image.url),
              },
            })
          : onDeleted(id);
      }
      return playlists;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Returns details about the requested artists.
   * @param ids The IDs of the artists.
   */
  async getArtistDetails(ids: string[]) {
    let artists: {
      id: string;
      details: { name: string; images: string[] };
    }[] = [];

    try {
      // get artists batch by batch
      while (ids.length > 0) {
        const idsSub = ids.splice(0, 50);
        const batch = (await this.getSpotifyApi().getArtists(idsSub)).body
          .artists;

        artists = artists.concat(
          batch.map((artist) => ({
            id: artist.id,
            details: {
              name: artist.name,
              images: artist.images.map((image) => image.url),
            },
          })),
        );
      }

      return artists;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Generates a Spotify playlist.
   * @param entries Information about playlists that the generation is based on etc.
   */
  async generatePlaylist(entries: ArtistPlaylistEntity[]) {
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
   * @param entries These contain the IDs of playlists and the number of songs that should be extracted.
   * @private
   */
  private async generateTrackList(entries: ArtistPlaylistEntity[]) {
    let tracks = [];

    try {
      // go through each playlist and get tracks
      for await (const entry of entries) {
        // get tracks from playlist
        const tracksSubset = await this.getTracksFromPlaylist(entry.playlist);

        // filter tracks and add them to array
        tracks = tracks.concat(trimTrackSelection(tracksSubset, entry.number));
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
            fields: 'total,limit,offset,items(track.uri)',
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

  /**
   * Returns true if user follows playlist and false if not.
   * @param id The ID of the playlist.
   * @param user The ID of the user.
   */
  async getPlaylistFollowingStatus(id: string, user: string) {
    try {
      const res = (
        await this.getSpotifyApi().areFollowingPlaylist(user, id, [user])
      ).body;

      if (res.length !== 1)
        throw new InternalServerErrorException(
          undefined,
          'There was an unexpected reply when asking for the following status.',
        );
      else return res.at(0);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
