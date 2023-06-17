import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IFirebaseService } from '../../services/external/IFirebase.service';
import * as fs from 'fs';
import { LoggingService, LogKey } from './logging.service';

@Injectable()
export class DatabaseService extends IFirebaseService {
  constructor(private readonly loggingService: LoggingService) {
    super();
    const credentialsFromFile = JSON.parse(
      fs.readFileSync(
        `./src/mashup/${process.env.FIREBASE_CREDENTIALS_MASHUP}.json`,
        'utf-8',
      ),
    );
    super.initialize(credentialsFromFile);
  }

  /**
   * Add a user to the mashup database.
   * @param userId A UUID that identifies the user.
   */
  async addUser(userId: string): Promise<string> {
    try {
      await super.updateEntry('users', userId, {});
      this.logData('add-user', `Added user ${userId}`, { userId });
      return userId;
    } catch (e) {
      this.logError('add-user', `Failed to add user ${userId}`, {
        userId,
        error: e,
      });
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
      this.logError(
        'update-spotify-token',
        `Failed to update Spotify token for user ${userId}`,
        {
          userId,
          spotifyRefresh: spotifyRefresh.substring(0, 6) + '...',
          error: e,
        },
      );
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
      this.logError(
        'get-user-data',
        `Failed to get user data for user ${userId}`,
        { userId, error: e },
      );
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

      this.logData(
        'add-user-playlist',
        `Added playlist ${playlistId} from user ${userId}`,
        { userId, playlistId },
      );
    } catch (e) {
      this.logError(
        'add-user-playlist',
        `Failed to add playlist ${playlistId} from user ${userId}`,
        { userId, playlistId, error: e },
      );
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

      this.logData(
        'update-user-playlist',
        `Updated playlist ${playlistId} from user ${userId}`,
        { userId, playlistId, artists, active, frequency },
      );
    } catch (e) {
      this.logError(
        'get-user-data',
        `Failed to update playlist ${playlistId} for user ${userId}`,
        { userId, playlistId, artists, active, frequency, error: e },
      );
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

      this.logData(
        'remove-user-playlist',
        `Removed playlist ${playlistId} from user ${userId}`,
        { userId, playlistId },
      );
    } catch (e) {
      this.logError(
        'remove-user-playlist',
        `Failed to remove playlist ${playlistId} for user ${userId}`,
        { userId, playlistId, error: e },
      );
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
      this.logError(
        'get-user-playlist',
        `Failed to get playlist ${playlistId} for user ${userId}`,
        { userId, playlistId, error: e },
      );
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
      this.logError(
        'get-user-playlists',
        `Failed to get playlists for user ${userId}`,
        { userId, error: e },
      );
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

        this.logData(
          'set-playlist-activeness',
          `Changed active status of playlist ${playlistId} from user ${userId} to ${active}`,
          { userId, playlistId },
        );
      }
    } catch (e) {
      this.logError(
        'set-playlist-activeness',
        `Failed to set playlist activeness of playlist ${playlistId} from user ${userId} to ${active}`,
        { userId, playlistId, active, error: e },
      );
      throw e;
    }
  }

  /**
   * Deletes a user.
   * @param userId A UUID that identifies the user.
   */
  async deleteUser(userId: string) {
    try {
      // get user playlist IDs
      const res = await super.getEntryField('users', userId, ['playlists']);
      const playlistIds = res ? Object.keys(res) : [];

      // remove users playlists from database
      for (const playlistId of playlistIds)
        await super.removeEntry('playlists', playlistId);

      // remove user from database
      await super.removeEntry('users', userId);

      this.logData('delete-user', `Deleted user ${userId} and playlists`, {
        userId,
        playlistIds,
      });
    } catch (e) {
      this.logError('delete-user', `Failed to delete user ${userId}`, {
        userId,
        error: e,
      });
      throw e;
    }
  }

  /**
   * Sets last updated time of a playlist to now.
   * @param userId A UUID that identifies the user.
   * @param playlistId The ID of the playlist.
   */
  async setPlaylistUpdated(userId: string, playlistId: string) {
    try {
      await super.updateEntryField('users', userId, ['playlists', playlistId], {
        updated: new Date().getTime(),
      });

      this.logData(
        'playlist-updated',
        `Updated last update time of playlist ${playlistId} from user ${userId}`,
        { userId, playlistId },
      );
    } catch (e) {
      this.logError(
        'set-playlist-updated',
        `Failed to update last updated time of playlist ${playlistId} from user ${userId}`,
        { userId, playlistId, error: e },
      );
      throw e;
    }
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
   * @param activeFlag Return only playlists that are marked as active.
   * @param refreshNeededFlag Return only playlists that are in need of a refresh.
   */
  async getAllPlaylists(
    activeFlag: boolean,
    refreshNeededFlag: boolean,
  ): Promise<{ playlist: PlaylistDataComplete; user: string }[]> {
    // get ALL user data to access related playlists
    const res = await super.getEntry('users', '');

    if (res) {
      let entries: { playlist: PlaylistDataComplete; user: string }[] = [];

      // bring data from database into form
      for (const userId of Object.keys(res)) {
        const entry = res[userId];

        // skip user if they have no playlists
        if (!entry.playlists) continue;

        // add users playlists to array with all playlists
        for (const playlistId of Object.keys(entry.playlists)) {
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
      if (activeFlag)
        entries = entries.filter(
          (entry) =>
            entry.playlist.active &&
            entry.playlist.updated &&
            entry.playlist.frequency,
        );

      // filter out playlists that are not old
      if (refreshNeededFlag)
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
          this.logData(
            'get-all-playlists',
            `Failed to get playlist ${entry.playlist.id}`,
            { entry, activeFlag, refreshNeededFlag, error: e },
          );
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

  private logData(
    operation: string,
    message: string,
    data: any,
    severity: string | undefined = undefined,
  ) {
    this.loggingService.logData(
      LogKey.DatabaseService,
      message,
      data,
      operation,
      severity,
    );
  }

  private logError(operation: string, message: string, data: any) {
    this.logData(operation, message, data, 'ERROR');
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
