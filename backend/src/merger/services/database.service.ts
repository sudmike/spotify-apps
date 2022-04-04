import { Injectable } from '@nestjs/common';
import { IFirebaseService } from '../../services/external/IFirebase.service';

@Injectable()
export class DatabaseService extends IFirebaseService {
  constructor() {
    super();
    import(`../${process.env.FIREBASE_CREDENTIALS_MERGER}.json`).then((res) => {
      super.initialize(res);
    });
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
   * @param description The playlists generated description.
   * @param artists The IDs of artists that are part of the playlist.
   */
  async addUserPlaylist(
    id: string,
    user: string,
    description: string,
    artists: string[],
  ): Promise<void> {
    try {
      // create playlist entry
      await super.addEntry('playlists', id, {
        user,
        description,
        artists,
      });

      // modify user entry
      await super.addEntryField('users', user, 'active-playlists', id, true);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Gets the playlist IDs of a user.
   * @param id A UUID that identifies the user.
   */
  async getUserPlaylists(id: string): Promise<{
    active: ActivePlaylistsData;
    inactive: InactivePlaylistsData;
  }> {
    try {
      const resA = await super.getEntryField('users', id, 'active-playlists');
      const resI = await super.getEntryField('users', id, 'inactive-playlists');

      // return mapped responses
      return {
        active: resA ? Object.keys(resA) : [],
        inactive: resI ? Object.keys(resI) : [],
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}

export type UserData = {
  id: string;
  refreshToken: string;
};

export type PlaylistsData = string[];

export type ActivePlaylistsData = PlaylistsData;
export type InactivePlaylistsData = PlaylistsData;
