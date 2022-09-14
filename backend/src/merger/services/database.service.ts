import {
  ConflictException,
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
   * @param id A UUID that identifies the user.
   */
  async addUser(id: string): Promise<string> {
    try {
      await super.updateEntry('users', id, {});
      return id;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Update refresh token for Spotify.
   * @param id A UUID that identifies the user.
   * @param spotifyRefresh The refresh token.
   */
  async updateSpotifyToken(
    id: string,
    spotifyRefresh: string,
  ): Promise<string> {
    try {
      await super.updateEntry('users', id, { spotifyRefresh });
      return id;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Gets the entry for a user.
   * @param id A UUID that identifies the user.
   */
  async getUserData(id: string): Promise<UserData> {
    try {
      const data = await super.getEntry('users', id);
      return { refreshToken: data.spotifyRefresh, id };
    } catch (e) {
      throw e;
    }
  }

  /**
   * Adds information about a generated playlist.
   * @param id The playlists ID.
   * @param user A UUID that identifies the user.
   * @param artists The IDs of artists that are part of the playlist.
   * @param active Refresh playlist every X days.
   * @param frequency Refresh playlist every X days.
   */
  async addUserPlaylist(
    id: string,
    user: string,
    artists: PlaylistArtistsData,
    active: boolean,
    frequency: number,
  ): Promise<void> {
    try {
      // create playlist entry
      await super.addEntry('playlists', id, {
        user,
        artists,
      });

      // modify user entry
      await super.addEntryField(
        'users',
        user,
        [active ? 'active-playlists' : 'inactive-playlists', id],
        {
          updated: new Date().getTime(),
          created: new Date().getTime(),
          frequency,
        },
      );
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Adds information about a generated playlist.
   * @param id The playlists ID.
   * @param user A UUID that identifies the user.
   * @param artists The IDs of artists that are part of the playlist.
   * @param active Refresh playlist every X days.
   * @param frequency Refresh playlist every X days.
   */
  async updateUserPlaylist(
    id: string,
    user: string,
    artists: PlaylistArtistsData,
    active: boolean,
    frequency: number,
  ): Promise<void> {
    try {
      // create playlist entry
      await super.updateEntry('playlists', id, {
        user,
        artists,
      });

      const res = await this.getAIPlaylist(user, id);

      // clean up the old entry if active status changed
      if (active != res.active) {
        await super.removeEntryField('users', user, [
          res.active ? 'active-playlists' : 'inactive-playlists',
          id,
        ]);
      }

      // modify user entry
      await super.updateEntryField(
        'users',
        user,
        [active ? 'active-playlists' : 'inactive-playlists', id],
        {
          updated: new Date().getTime(),
          created: res.created ? res.created : null,
          frequency,
        },
      );
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Removes information about a playlist.
   * @param id The playlists ID.
   * @param user A UUID that identifies the user.
   */
  async removeUserPlaylist(id: string, user: string) {
    try {
      await super.removeEntry('playlists', id);
      await super.removeEntryField('users', user, ['inactive-playlists', id]);
      await super.removeEntryField('users', user, ['active-playlists', id]);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Gets a specific playlist ID of a user and the IDs of the related artists.
   * @param id A UUID that identifies the user.
   * @param playlist The ID of the playlist.
   */
  async getUserPlaylist(id: string, playlist: string): Promise<PlaylistData> {
    try {
      const res = await this.getAIPlaylist(id, playlist);
      return {
        id: playlist,
        updated: res.updated,
        created: res.created,
        active: res.active,
        frequency: res.frequency,
        artists: await this.getPlaylistArtists(playlist, id),
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Gets the playlist IDs of a user and the IDs of the related artists.
   * @param id A UUID that identifies the user.
   */
  async getUserPlaylists(id: string): Promise<PlaylistData[]> {
    try {
      const resA = await super.getEntryField('users', id, ['active-playlists']);
      const resI = await super.getEntryField('users', id, [
        'inactive-playlists',
      ]);

      // map responses to arrays of playlist ids
      const activeIds = resA ? Object.keys(resA) : [];
      const inactiveIds = resI ? Object.keys(resI) : [];

      const playlists: PlaylistData[] = [];
      for await (const playlistId of activeIds)
        playlists.push({
          id: playlistId,
          artists: await this.getPlaylistArtists(playlistId, id),
          updated: resA[playlistId].updated,
          created: resA[playlistId].created,
          active: true,
          frequency: resA[playlistId].frequency,
        });

      for await (const playlistId of inactiveIds)
        playlists.push({
          id: playlistId,
          artists: await this.getPlaylistArtists(playlistId, id),
          updated: resI[playlistId].updated,
          created: resI[playlistId].created,
          active: false,
          frequency: resI[playlistId].frequency,
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
   * @param id A UUID that identifies the user.
   * @param playlist The ID of the playlist.
   * @param active Defines if playlist refreshing should be set to active or to inactive.
   */
  async setPlaylistActiveness(id: string, playlist: string, active: boolean) {
    try {
      const res = await this.getAIPlaylist(id, playlist);
      if (res.active === active) return;
      else {
        // change status according to 'active' parameter
        const add = active ? 'active-playlists' : 'inactive-playlists';
        const remove = active ? 'inactive-playlists' : 'active-playlists';
        await super.addEntryField('users', id, [add, playlist], res.data);
        await super.removeEntryField('users', id, [remove, playlist]);
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Sets last updated time of a playlist to now.
   * @param id A UUID that identifies the user.
   * @param playlist The ID of the playlist.
   */
  async setPlaylistUpdated(id: string, playlist: string) {
    const data = await this.getAIPlaylist(id, playlist);

    await super.updateEntryField(
      'users',
      id,
      [data.active ? 'active-playlists' : 'inactive-playlists', playlist],
      { updated: new Date().getTime() },
    );
  }

  /**
   * Return an array of artist IDs and related information.
   * @param id The ID of the playlist.
   * @param user A UUID that identifies the user.
   */
  async getPlaylistArtists(
    id: string,
    user: string,
  ): Promise<PlaylistArtistsData> {
    const res = await super.getEntry('playlists', id);

    if (!res) throw new NotFoundException(undefined, 'Not found in database');

    if (res.user === user) {
      return res.artists;
    } else {
      throw new UnauthorizedException(
        undefined,
        'Requested playlist does not belong to user',
      );
    }
  }

  /**
   * Checks for a playlist in the active and inactive section of the database and returns the contents and if it is active or inactive.
   * @param id A UUID that identifies the user.
   * @param playlist The ID of the playlist.
   */
  private async getAIPlaylist(
    id: string,
    playlist: string,
  ): Promise<{
    data: any;
    updated: number;
    created: number;
    active: boolean;
    frequency: number;
  }> {
    const fieldActive = 'active-playlists';
    const fieldInactive = 'inactive-playlists';
    const active = await super.getEntryField('users', id, [
      fieldActive,
      playlist,
    ]);
    const inactive = await super.getEntryField('users', id, [
      fieldInactive,
      playlist,
    ]);

    // throw error if playlist cannot be found
    if (!active && !inactive) {
      throw new NotFoundException(undefined, `Playlist could not be found`);
    } else if (active && inactive) {
      throw new ConflictException(
        undefined,
        'There is an inconsistency in the database because a playlist is set as both active and inactive',
      );
    } else {
      return active
        ? {
            data: active,
            active: true,
            updated: active.updated,
            created: active.created,
            frequency: active.frequency,
          }
        : {
            data: inactive,
            active: false,
            updated: inactive.updated,
            created: inactive.created,
            frequency: inactive.frequency,
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
type PlaylistDataRes = { id: string; artists: PlaylistArtistsData };
export type PlaylistData = PlaylistDataRes & {
  updated: number;
  created: number;
  active: boolean;
  frequency: number;
};
