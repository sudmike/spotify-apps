import { Injectable, UnauthorizedException } from '@nestjs/common';
import SpotifyWebApi from 'spotify-web-api-node';

@Injectable()
export abstract class ISpotifyService {
  private readonly spotifyApi: SpotifyWebApi;

  // contains state codes connected to requests that were sent out to Spotify
  private states: {
    state: string;
    timeoutHandler: NodeJS.Timeout;
  }[] = [];

  protected constructor(credentials: SpotifyCredentials) {
    this.spotifyApi = new SpotifyWebApi(credentials);
  }

  /**
   * Starts off the OAuth flow by creating and returning URL for OAuth redirection.
   * @param scopes The scopes that are requested from Spotify.
   */
  loginRedirect(scopes: string[]): string {
    const state = generateRandomString(32);
    const timeoutHandler = setTimeout(
      () => this.removeState(state),
      5 * 60 * 1000,
    );
    this.states.push({ state, timeoutHandler });

    return this.spotifyApi.createAuthorizeURL(scopes, state);
  }

  /**
   * Completes the OAuth flow by sending a post request to Spotify for the tokens.
   * @param state The state that was sent with the initial request. Protection from CSRF.
   * @param code The authorization code provided by Spotify.
   */
  async callback(state: string, code: string) {
    // check state to prevent CSRF
    const index = this.states.findIndex((tuple) => tuple.state === state);

    if (index > -1) {
      // remove entry from states
      this.removeStateAtIndex(index);

      // request tokens from Spotify
      try {
        const res = (await this.spotifyApi.authorizationCodeGrant(code)).body;
        this.spotifyApi.setAccessToken(res.access_token);
        return {
          ...res,
          username: await this.getUsername(),
        };
      } catch (e) {
        throw new UnauthorizedException(
          undefined,
          `Failed to finish Spotify OAuth flow. Error: ${e.body.error}, error description: ${e.body.error_description}.`,
        );
      }
    } else {
      // send an error if the state is invalid
      throw new UnauthorizedException(
        undefined,
        'Spotify callback not allowed, due to invalid state or because too much time has passed.',
      );
    }
  }

  /**
   * Refreshes the tokens and returns them.
   * @param refreshToken The current refresh token.
   */
  async getTokens(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    this.spotifyApi.setRefreshToken(refreshToken);
    try {
      const response = (await this.spotifyApi.refreshAccessToken()).body;
      return {
        access_token: response.access_token,
        expires_in: response.expires_in,
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Returns Spotify API instance to extending classes.
   * @protected
   */
  protected getSpotifyApi(): SpotifyWebApi {
    return this.spotifyApi;
  }

  /**
   * Sets the access token of the spotify API instance.
   * @param accessToken The current refresh token.
   * @protected
   */
  protected setAccessToken(accessToken: string): void {
    this.spotifyApi.setAccessToken(accessToken);
  }

  /**
   * Returns the username of the user that the tokens belong to.
   * @protected
   */
  protected async getUsername(): Promise<string> {
    try {
      return (await this.spotifyApi.getMe()).body.id;
    } catch (e) {
      console.log(e);
      throw new Error(e.body);
    }
  }

  private removeState(state: string) {
    const index = this.states.findIndex((tuple) => tuple.state === state);
    if (index > -1) this.removeStateAtIndex(index);
  }

  private removeStateAtIndex(index: number) {
    const tuple = this.states.at(index);
    if (tuple) {
      clearTimeout(tuple.timeoutHandler);
      this.states.splice(index);
    }
  }
}

/**
 * Function that generates random string for OAuth states.
 * @param length The length of the string that is generated.
 */
function generateRandomString(length: number): string {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export type SpotifyCredentials = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
};
