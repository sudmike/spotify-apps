import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  generatePlaylistDescription,
  generatePlaylistTitle,
  shuffleArray,
  trimTrackSelection,
} from './generation.helper';
import { SearchArtistResponseSchema } from '../schemas/response/search-artist-response.schema';
import GenerationInformationEntity from '../schemas/entities/generation-information.entity';
import { ArtistFull } from '../schemas/entities/artist-full.entity';
import { SpotifyTokenService } from './spotify-token.service';

@Injectable()
export class SpotifyService extends SpotifyTokenService {
  /**
   * Returns the artist that matches the requested artist name.
   * @param artist The name of the artist to return results for.
   */
  async searchArtist(artist: string): Promise<SearchArtistResponseSchema> {
    try {
      const res = (
        await super.getSpotifyApi().searchArtists(artist, { limit: 1 })
      ).body.artists;
      const entry = res.items.at(0);
      const more: null | number = res.next ? 1 : null;

      // artist has to fulfill the following requirements
      // 0. artist needs to not be null
      // 1. artist needs images
      // 2. artist needs to be popular enough
      // 3. artist need to have enough followers
      if (
        !entry ||
        entry.images.length !== 3 ||
        entry.popularity < 35 ||
        entry.followers.total < 5000
      ) {
        return { query: artist, next: more, artist: null };
      }

      // check for 'This is XYZ' playlist
      const playlist = await this.getThisIsPlaylistId(entry.name);
      if (!entry || !playlist)
        return { query: artist, next: more, artist: null };
      else entry.href = playlist;

      return {
        query: artist,
        next: more,
        artist: {
          id: entry.id,
          name: entry.name,
          images: entry.images.map((image) => image.url),
          playlist: entry.href,
          number: null,
        },
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
    const username = await super.getUsername();
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
  async generatePlaylist(entries: ArtistFull[]) {
    try {
      const artists = entries.map((entry) => entry.name);
      const title = generatePlaylistTitle(artists);
      const description = generatePlaylistDescription(artists);
      const tracks = await this.generateTrackList(entries);

      const res = await this.getSpotifyApi().createPlaylist(title, {
        description,
      });
      const playlistId = res.body.id;

      await this.setTracksOfPlaylist(playlistId, tracks);

      return playlistId;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Updates a Spotify playlist.
   * @param playlist The ID of the playlist.
   * @param entries Information about playlists that the generation is based on etc.
   */
  async updatePlaylist(playlist: string, entries: ArtistFull[]) {
    try {
      const artists = entries.map((entry) => entry.name);
      const title = generatePlaylistTitle(artists);
      const description = generatePlaylistDescription(artists);
      const tracks = await this.generateTrackList(entries);

      await this.getSpotifyApi().changePlaylistDetails(playlist, {
        name: title,
        description,
      });

      await this.setTracksOfPlaylist(playlist, tracks);

      return playlist;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Regenerates the track list for an already created playlist.
   * @param playlist The ID of the playlist.
   * @param entries Information about playlists that the generation is based on etc.
   */
  async regeneratePlaylist(
    playlist: string,
    entries: GenerationInformationEntity[],
  ) {
    const tracks = await this.generateTrackList(entries);
    await this.setTracksOfPlaylist(playlist, tracks);
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

  /**
   * Returns a list of song IDs that are extracted from the playlists which are passed.
   * @param entries These contain the IDs of playlists and the number of songs that should be extracted.
   * @private
   */
  private async generateTrackList(entries: GenerationInformationEntity[]) {
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
   * Adds tracks to a playlist and replaces any old ones.
   * @param id The ID of the playlist.
   * @param tracks The IDs of the tracks that should be added.
   * @private
   */
  private async setTracksOfPlaylist(id: string, tracks: string[]) {
    try {
      let first = true;
      while (tracks.length > 0) {
        const batch = tracks.splice(0, 100);
        first
          ? await this.getSpotifyApi().replaceTracksInPlaylist(id, batch)
          : await this.getSpotifyApi().addTracksToPlaylist(id, batch);
        first = false;
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
      const res = await super
        .getSpotifyApi()
        .searchPlaylists('This is ' + artist, { limit: 1 });
      const playlist = res.body.playlists.items?.at(0);

      // only return playlist if it's the right playlist
      if (
        playlist &&
        playlist.owner.id === 'spotify' &&
        this.similarity(artist, playlist.name.substring(8)) > 0.75
      )
        return playlist.id;
      else return undefined;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Compares two strings on their similarity.
   * Returns a number between 0 and 1; the higher the number, the more similarity there is.
   * @param s1 First string.
   * @param s2 Second string.
   * @private
   */
  private similarity(s1: string, s2: string) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (longerLength - this.editDistance(longer, shorter)) / longerLength;
  }

  private editDistance(s1: string, s2: string) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i == 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }
}
