import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  cleanArray,
  generatePlaylistDescription,
  generatePlaylistTitle,
  shuffleArray,
  trimTrackSelection,
} from './generation.helper';
import { SearchArtistResponseSchema } from '../schemas/response/search-artist-response.schema';
import GenerationInformationEntity from '../schemas/entities/generation-information.entity';
import { ArtistFull } from '../schemas/entities/artist-full.entity';
import { SpotifyTokenService } from './spotify-token.service';
import { LogKey } from './logging.service';

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

      // check that artist comes into question
      if (this.isArtistRelevant(entry)) {
        // check if there are artists with similar names
        const alternatives = (
          await super.getSpotifyApi().searchArtists(entry.name, { limit: 3 })
        ).body.artists.items;

        const doAlternativesExist =
          alternatives &&
          alternatives.filter((alternative) => {
            // alternative comes into question if it is not the original, is relevant and is similar in name to the original
            return (
              alternative.id !== entry.id &&
              this.isArtistRelevant(alternative) &&
              this.similarity(entry.name, alternative.name) > 0.7
            );
          }).length > 0;

        // check for 'This is XYZ' playlist
        const playlist = await this.getThisIsPlaylistId(
          entry.name,
          entry.uri,
          doAlternativesExist,
        );

        if (!entry || !playlist)
          return {
            query: artist,
            artist: null,
            errorReason: "Artist does not have a 'This Is' playlist",
          };
        else entry.href = playlist;

        return {
          query: artist,
          artist: {
            id: entry.id,
            name: entry.name,
            images: entry.images.map((image) => image.url),
            playlist: entry.href,
            number: null,
          },
          errorReason: null,
        };
      } else {
        return {
          query: artist,
          artist: null,
          errorReason: 'Could not find artist',
        };
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Returns details about the requested playlists.
   * @param username The user's Spotify username.
   * @param ids The IDs of the playlists.
   * @param onDeleted Handler for when a playlist has been deleted.
   */
  async getPlaylistDetails(
    username: string,
    ids: string[],
    onDeleted?: (playlist) => void,
  ) {
    // code structure is bad because awaits cannot be used for parallelization!

    try {
      // for each id return the playlist as long as the playlist is still being followed
      return (
        await Promise.all(
          ids.map((id) =>
            this.getSpotifyApi()
              .getPlaylist(id, {
                fields: 'id,name,description,images',
              })
              .then((playlistResponse) =>
                this.getPlaylistFollowingStatus(
                  playlistResponse.body.id,
                  username,
                ).then((isFollowing) => {
                  const playlist = playlistResponse.body;
                  if (isFollowing) {
                    return {
                      id: playlist.id,
                      details: {
                        name: playlist.name,
                        description: playlist.description,
                        images: playlist.images.map((image) => image.url),
                      },
                    };
                  } else {
                    onDeleted(playlist.id);
                    return null;
                  }
                }),
              ),
          ),
        )
      ).filter((playlist) => playlist);
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

      this.logData('generate-playlist', `Generated playlist ${playlistId}`, {
        playlistId,
        inputPlaylistIds: entries.map((e) => e.playlist),
        title,
        description,
      });

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
   * @param updateTitle Defines if the title of the playlist should be updated.
   * @param updateDescription Defines if the description of the playlist should be updated.
   * @param updateSongs Defines if the songs of the playlist should be updated.
   */
  async updatePlaylist(
    playlist: string,
    entries: ArtistFull[],
    updateTitle: boolean,
    updateDescription: boolean,
    updateSongs: boolean,
  ) {
    try {
      const artists = entries.map((entry) => entry.name);
      const title = generatePlaylistTitle(artists);
      const description = generatePlaylistDescription(artists);

      if (updateTitle || updateDescription)
        await this.getSpotifyApi().changePlaylistDetails(playlist, {
          name: updateTitle ? title : undefined,
          description: updateDescription ? description : undefined,
        });

      if (updateSongs) {
        const tracks = await this.generateTrackList(entries);
        await this.setTracksOfPlaylist(playlist, tracks);
      }

      this.logData('update-playlist', `Updated playlist ${playlist}`, {
        playlist,
        updateTitle,
        updateDescription,
        updateSongs,
        inputPlaylistIds: entries.map((e) => e.playlist),
        title,
        description,
      });

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
    this.logData(
      'regenerate-playlist',
      `Regenerated tracks for playlist ${playlist}`,
      { playlist, inputPlaylistIds: entries.map((e) => e.playlist) },
    );
  }

  /**
   * Regenerates the track list for multiple already created playlists.
   * @param data The IDs of the playlists and the information that the generation is based on.
   * @param OnUpdated Callback function that informs about playlists that were updated.
   */
  async regeneratePlaylists(
    data: {
      user: string;
      playlist: string;
      entries: GenerationInformationEntity[];
    }[],
    OnUpdated?: (playlist: string, user: string) => void,
  ) {
    for (const tuple of data) {
      // set access token so that token of user is used to update
      await super.setAccessTokenByUserId(tuple.user);

      // generate track list and update playlist
      const tracks = await this.generateTrackList(tuple.entries);
      await this.setTracksOfPlaylist(tuple.playlist, tracks);

      // inform caller that playlist was updated
      OnUpdated(tuple.user, tuple.playlist);
    }
  }

  /**
   * Regenerates the details for an already created playlist.
   * @param playlist The ID of the playlist.
   * @param artistNames The names of artists to base the description on.
   * @param titleFlag Should the playlists title be updated.
   * @param descriptionFlag Should the playlists description be updated.
   */
  async regenerateDetails(
    playlist: string,
    artistNames: string[],
    titleFlag: boolean,
    descriptionFlag: boolean,
  ) {
    if (!titleFlag && !descriptionFlag) return;

    const title = generatePlaylistTitle(artistNames);
    const description = generatePlaylistDescription(artistNames);

    await this.getSpotifyApi().changePlaylistDetails(playlist, {
      name: titleFlag ? title : undefined,
      description: descriptionFlag ? description : undefined,
    });

    this.logData(
      'regenerate-details',
      `Regenerated details for playlist ${playlist}`,
      {
        playlist,
        artistNames,
        regenerateTitle: titleFlag,
        regenerateDescription: descriptionFlag,
        title,
        description,
      },
    );
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
   * Return true if the artist is relevant and false if not.
   * Check comments in implementation to see metrics.
   * @param artist The artist object.
   * @private
   */
  private isArtistRelevant(artist: SpotifyApi.ArtistObjectFull): boolean {
    // artist has to fulfill the following requirements to be relevant
    // 0. artist needs to not be null
    // 1. artist needs images
    // 2. artist needs to be popular enough
    // 3. artist need to have enough followers
    return (
      artist &&
      artist.images.length >= 3 &&
      artist.popularity >= 35 &&
      artist.followers.total >= 5000
    );
  }

  /**
   * Returns the 'This Is' playlist that is most likely to belong to the artist.
   * @param playlists The playlists that come into question.
   * @param artist The name of the artist to match against.
   * @private
   */
  private getCorrectThisIsPlaylist(
    playlists: SpotifyApi.PlaylistObjectSimplified[],
    artist: string,
  ): SpotifyApi.PlaylistObjectSimplified | undefined {
    if (!playlists) return undefined;

    // remove all playlists that are unfit
    const validPlaylists = playlists.filter(
      (playlist) =>
        playlist.owner.id === 'spotify' &&
        this.similarity(artist, playlist.name.substring(8)) >= 0.75,
    );

    const sortedPlaylists = validPlaylists.sort((p1, p2) =>
      this.similarity(artist, p1.name) > this.similarity(artist, p2.name)
        ? -1
        : 1,
    );

    return sortedPlaylists ? sortedPlaylists.at(0) : undefined;
  }

  /**
   * Returns a list of song IDs that are extracted from the playlists which are passed.
   * @param entries These contain the IDs of playlists and the number of songs that should be extracted.
   * @private
   */
  private async generateTrackList(entries: GenerationInformationEntity[]) {
    let tracks = [];
    const firstTracks = [];

    // go through each playlist and get tracks
    for await (const entry of entries) {
      try {
        // get tracks from playlist
        const tracksSubset = await this.getTracksFromPlaylist(entry.playlist);

        // filter tracks and add them to arrays
        const tracksSubsetTrimmed = trimTrackSelection(
          tracksSubset,
          entry.number,
        );
        firstTracks.push(tracksSubsetTrimmed.at(0));
        tracks = tracks.concat(tracksSubsetTrimmed.slice(1));
      } catch (e) {
        // skip playlist that could not be found
        // ... WARNING log
      }
    }

    return cleanArray(firstTracks.concat(shuffleArray(tracks)));
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
   * @param artistUri The URI of the artist.
   * @param deepCheck Flag that decides if the artist's playlist needs extra checks.
   * @private
   */
  private async getThisIsPlaylistId(
    artist: string,
    artistUri: string,
    deepCheck: boolean,
  ) {
    if (!artist) return undefined;

    try {
      const res = await super
        .getSpotifyApi()
        .searchPlaylists('This is ' + artist, { limit: 3 });

      const playlist = this.getCorrectThisIsPlaylist(
        res.body.playlists?.items,
        artist,
      );

      // do a static check of the playlist
      if (playlist) {
        if (!deepCheck) return playlist.id;
        else {
          // ensure that tracks in playlist are from artist
          const artistUrisPerTrack = (
            await super.getSpotifyApi().getPlaylistTracks(playlist.id, {
              limit: 5,
              fields: 'items(track(artists.uri))',
            })
          ).body.items.map((item) =>
            item.track.artists.map((artist) => artist.uri),
          );

          const correctArtist: boolean = artistUrisPerTrack.every(
            (artistUris) => artistUris.indexOf(artistUri) > -1,
          );

          return correctArtist ? playlist.id : undefined;
        }
      } else return undefined;
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

  private logData(operation: string, message: string, data: any) {
    this.loggingService.logData(
      LogKey.spotifyService,
      message,
      data,
      operation,
    );
  }
}
