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
}
