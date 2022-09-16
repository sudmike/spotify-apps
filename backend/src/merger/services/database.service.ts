import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IFirebaseService } from '../../services/external/IFirebase.service';
import * as fs from 'fs';

@Injectable()
export class DatabaseService extends IFirebaseService {
  constructor() {
    super();
    const credentialsFromFile = JSON.parse(
      fs.readFileSync(
        `./src/merger/${process.env.FIREBASE_CREDENTIALS_MERGER}.json`,
        'utf-8',
      ),
    );
    super.initialize(credentialsFromFile);
  }

  /**
   * Add a user to the merger database.
   * @param userId A UUID that identifies the user.
   */
  async addUser(userId: string): Promise<string> {
    try {
      await super.updateEntry('users', userId, {});
      return userId;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Update refresh token for Spotify.
   * @param userId A UUID that identifies the user.
   * @param spotifyRefresh The refresh token.
   */
  async updateSpotifyToken(
    userId: string,
    spotifyRefresh: string,
  ): Promise<string> {
    try {
      await super.updateEntry('users', userId, { spotifyRefresh });
      return userId;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Gets the entry for a user.
   * @param userId A UUID that identifies the user.
   */
  async getUserData(userId: string): Promise<UserData> {
    try {
      const data = await super.getEntry('users', userId);
      return { refreshToken: data.spotifyRefresh, id: userId };
    } catch (e) {
      throw e;
    }
  }

  /**
   * Adds information about a generated playlist.
   * @param playlistId The playlists ID.
   * @param userId A UUID that identifies the user.
   * @param artists The IDs of artists that are part of the playlist.
   * @param active Refresh playlist every X days.
   * @param frequency Refresh playlist every X days.
   */
  async addUserPlaylist(
    playlistId: string,
    userId: string,
    artists: PlaylistArtistsData,
    active: boolean,
    frequency: number,
  ): Promise<void> {
    try {
      // create playlist entry
      await super.addEntry('playlists', playlistId, {
        user: userId,
        artists,
      });

      // modify user entry
      await super.addEntryField('users', userId, ['playlists', playlistId], {
        updated: new Date().getTime(),
        created: new Date().getTime(),
        active,
        frequency,
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Adds information about a generated playlist.
   * @param playlistId The playlists ID.
   * @param userId A UUID that identifies the user.
   * @param artists The IDs of artists that are part of the playlist.
   * @param active Refresh playlist every X days.
   * @param frequency Refresh playlist every X days.
   */
  async updateUserPlaylist(
    playlistId: string,
    userId: string,
    artists: PlaylistArtistsData,
    active: boolean,
    frequency: number,
  ): Promise<void> {
    try {
      // create playlist entry
      await super.updateEntry('playlists', playlistId, {
        user: userId,
        artists,
      });

      const res = await this.getPlaylist(userId, playlistId);

      // modify user entry
      await super.updateEntryField('users', userId, ['playlists', playlistId], {
        updated: new Date().getTime(),
        created: res.created ? res.created : null,
        active,
        frequency,
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Removes information about a playlist.
   * @param playlistId The playlists ID.
   * @param userId A UUID that identifies the user.
   */
  async removeUserPlaylist(playlistId: string, userId: string) {
    try {
      await super.removeEntry('playlists', playlistId);
      await super.removeEntryField('users', userId, ['playlists', playlistId]);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Gets a specific playlist ID of a user and the IDs of the related artists.
   * @param userId A UUID that identifies the user.
   * @param playlistId The ID of the playlist.
   */
  async getUserPlaylist(
    userId: string,
    playlistId: string,
  ): Promise<PlaylistDataComplete> {
    try {
      const res = await this.getPlaylist(userId, playlistId);
      return {
        id: playlistId,
        updated: res.updated,
        created: res.created,
        active: res.active,
        frequency: res.frequency,
        artists: await this.getPlaylistArtists(playlistId, userId),
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Gets the playlist IDs of a user and the IDs of the related artists.
   * @param userId A UUID that identifies the user.
   */
  async getUserPlaylists(userId: string): Promise<PlaylistDataComplete[]> {
    try {
      const res = await super.getEntryField('users', userId, ['playlists']);

      // map responses to arrays of playlist ids
      const ids = res ? Object.keys(res) : [];

      const playlists: PlaylistDataComplete[] = [];
      for await (const playlistId of ids)
        playlists.push({
          id: playlistId,
          artists: await this.getPlaylistArtists(playlistId, userId),
          ...res[playlistId],
        });

      // sort playlists by creation date
      playlists.sort((p1, p2) => {
        return p1.created && p2.created
          ? p2.created - p1.created
          : p1.created
          ? -1
          : 1;
      });

      return playlists;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Changes a playlist to active or inactive.
   * @param userId A UUID that identifies the user.
   * @param playlistId The ID of the playlist.
   * @param active Defines if playlist refreshing should be set to active or to inactive.
   */
  async setPlaylistActiveness(
    userId: string,
    playlistId: string,
    active: boolean,
  ) {
    try {
      const res = await this.getPlaylist(userId, playlistId);
      if (res.active === active) return;
      else {
        // change status according to 'active' parameter
        await super.updateEntryField(
          'users',
          userId,
          ['playlists', playlistId],
          {
            active,
          },
        );
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Sets last updated time of a playlist to now.
   * @param userId A UUID that identifies the user.
   * @param playlistId The ID of the playlist.
   */
  async setPlaylistUpdated(userId: string, playlistId: string) {
    await super.updateEntryField('users', userId, ['playlists', playlistId], {
      updated: new Date().getTime(),
    });
  }

  /**
   * Return an array of artist IDs and related information.
   * @param playlistId The ID of the playlist.
   * @param userId A UUID that identifies the user.
   */
  async getPlaylistArtists(
    playlistId: string,
    userId: string,
  ): Promise<PlaylistArtistsData> {
    const res = await super.getEntry('playlists', playlistId);

    if (!res) throw new NotFoundException(undefined, 'Not found in database');

    if (res.user === userId) {
      return res.artists;
    } else {
      throw new UnauthorizedException(
        undefined,
        'Requested playlist does not belong to user',
      );
    }
  }

  /**
   * Get all active playlists.
   */
  async getAllActivePlaylists(): Promise<
    { playlist: PlaylistDataComplete; user: string }[]
  > {
    // get ALL user data to access related playlists
    const res = await super.getEntry('users', '');

    if (res) {
      let entries: { playlist: PlaylistDataComplete; user: string }[] = [];

      // bring data from database into form
      for (const userId of Object.keys(res)) {
        const entry = res[userId];

        for (const playlistId of Object.keys(entry['playlists'])) {
          const playlist = entry.playlists[playlistId];
          entries.push({
            user: userId,
            playlist: {
              id: playlistId,
              ...playlist,
              artists: [],
            },
          });
        }
      }

      // filter out playlists that should not be updated or miss crucial data
      entries = entries.filter(
        (entry) =>
          entry.playlist.active &&
          entry.playlist.updated &&
          entry.playlist.frequency,
      );

      // filter out playlists that are not old
      entries = entries.filter((entry) => {
        const currentTime = new Date().getTime();
        const expirationTime =
          entry.playlist.updated +
          entry.playlist.frequency * 24 * 60 * 60 * 1000 -
          60 * 60 * 1000; // include one hour of lenience
        return currentTime > expirationTime;
      });

      // enhance with data about related artists
      for (const entry of entries) {
        try {
          entry.playlist.artists = await this.getPlaylistArtists(
            entry.playlist.id,
            entry.user,
          );
        } catch (e) {
          console.log(e);
          // remove playlist
          entries = entries.filter((e) => e.playlist.id !== entry.playlist.id);
        }
      }

      return entries;
    }
  }

  /**
   * Returns the contents of a playlist from the database.
   * @param userId A UUID that identifies the user.
   * @param playlistId The ID of the playlist.
   */
  private async getPlaylist(
    userId: string,
    playlistId: string,
  ): Promise<PlaylistMetadata> {
    const playlist = await super.getEntryField('users', userId, [
      'playlists',
      playlistId,
    ]);

    // throw error if playlist cannot be found
    if (!playlist) {
      throw new NotFoundException(undefined, `Playlist could not be found`);
    } else {
      return {
        ...playlist,
      };
    }
  }
}

export type UserData = {
  id: string;
  refreshToken: string;
};

export type PlaylistArtistsData = {
  id: string;
  playlist: string;
  number: number;
}[];
type PlaylistData = { id: string; artists: PlaylistArtistsData };
type PlaylistMetadata = {
  updated: number;
  created: number;
  active: boolean;
  frequency: number;
};
export type PlaylistDataComplete = PlaylistData & PlaylistMetadata;
