import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ISpotifyService } from '../../services/ISpotify.service';

@Injectable()
export class SpotifyTokenService extends ISpotifyService {
  private tokenCache = new Map<
    string,
    {
      refreshToken: string;
      accessToken: string;
      username: string;
      expiration: Date;
      timeoutHandler: NodeJS.Timeout;
    }
  >();

  constructor(private readonly databaseService: DatabaseService) {
    const spotifyCredentials = {
      clientId: process.env.SPOTIFY_CLIENT_ID_MASHUP,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET_MASHUP,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI_MASHUP,
    };

    super(spotifyCredentials);
  }

  async setAccessTokenByUserId(id: string) {
    const accessToken = await this.getAccessToken(id);
    super.setAccessToken(accessToken);
  }

  /**
   * Returns the username of the user that the tokens belong to.
   * @protected
   */
  protected async getUsername(): Promise<string> {
    try {
      const refreshToken = super.getSpotifyApi().getCredentials().refreshToken;

      // check cache for username by matching the refresh token
      for (const value of this.tokenCache.values()) {
        if (value.refreshToken === refreshToken) return value.username;
      }

      // send a Spotify request in case the username can't be found in cache
      return super.getUsername();
    } catch (e) {
      console.log(e);
      throw new Error(e.body);
    }
  }

  private async getAccessToken(id: string) {
    // get from database if there is no cache entry
    if (!this.tokenCache.has(id)) {
      try {
        const user = await this.databaseService.getUserData(id);
        const refreshToken = user.refreshToken;

        const tokens = await this.getTokens(refreshToken);
        const accessToken = tokens.access_token;
        const expiration = new Date(Date.now() + 1000 * tokens.expires_in);
        const timeoutHandler = setTimeout(
          () => this.removeUser(user.id),
          1000 * tokens.expires_in + 1000 * 3600,
        );

        // getting the username is only relevant for quick retrieval later
        super.setAccessToken(accessToken);
        const username = await super.getUsername();

        // add entry to user cache
        this.tokenCache.set(id, {
          refreshToken,
          accessToken,
          username,
          expiration,
          timeoutHandler,
        });

        return accessToken;
      } catch (e) {
        console.log(e);
        throw e;
      }
    }
    // use cache to get access token
    else {
      const entry = this.tokenCache.get(id);

      // use cached access token if it is still valid
      if (entry.expiration > new Date(Date.now())) {
        return entry.accessToken;
      }
      // refresh access token if it is expired
      else {
        const tokens = await this.getTokens(entry.refreshToken);
        this.updateUserAccessToken(id, tokens.access_token, tokens.expires_in);

        return tokens.access_token;
      }
    }
  }

  private removeUser(id: string) {
    const entry = this.tokenCache.get(id);
    if (entry) {
      clearTimeout(entry.timeoutHandler);
      this.tokenCache.delete(id);
    }
  }

  private updateUserAccessToken(
    id: string,
    accessToken: string,
    expiresInMs: number,
  ) {
    const entry = this.tokenCache.get(id);
    if (entry) {
      entry.accessToken = accessToken;
      entry.expiration = new Date(Date.now() + 1000 * expiresInMs);
      clearTimeout(entry.timeoutHandler);
      entry.timeoutHandler = setTimeout(
        () => this.removeUser(id),
        1000 * expiresInMs + 1000 * 3600,
      );
    }
  }
}