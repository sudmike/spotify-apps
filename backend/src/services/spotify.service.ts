import { Injectable, UnauthorizedException } from '@nestjs/common';
import SpotifyWebApi from 'spotify-web-api-node';

@Injectable()
export class SpotifyService {
  private spotifyApi = new SpotifyWebApi();

  // contains state codes connected to requests that were sent out to Spotify
  private states: { state: string; clientId: string }[] = [];

  /**
   * Starts off the OAuth flow by creating and returning URL for OAuth redirection.
   * @param credentials Spotify application credentials.
   * @param scopes The scopes that are requested from Spotify.
   */
  loginRedirect(credentials: SpotifyCredentials, scopes: string[]): string {
    this.spotifyApi.setCredentials(credentials);

    const state = generateRandomString(32);
    this.states.push({ state, clientId: credentials.clientId });

    return this.spotifyApi.createAuthorizeURL(scopes, state);
  }

  /**
   * Completes the OAuth flow by sending a post request to Spotify for the tokens.
   * @param credentials Spotify application credentials.
   * @param state The state that was sent with the initial request. Protection from CSRF.
   * @param code The authorization code provided by Spotify.
   */
  async callback(credentials: SpotifyCredentials, state: string, code: string) {
    this.spotifyApi.setCredentials(credentials);

    // check state to prevent CSRF
    const index = this.states.findIndex(
      (tuple) =>
        tuple.state === state && tuple.clientId === credentials.clientId,
    );

    if (index > -1) {
      // remove entry from states
      this.states.splice(index);

      // request tokens from Spotify
      try {
        const res = (await this.spotifyApi.authorizationCodeGrant(code)).body;
        this.spotifyApi.setAccessToken(res.access_token);
        return {
          ...res,
          username: await SpotifyService.getUsername(this.spotifyApi),
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
        'Spotify callback not allowed, due to invalid state.',
      );
    }
  }

  private static async getUsername(spotifyApi: SpotifyWebApi): Promise<string> {
    try {
      return (await spotifyApi.getMe()).body.id;
    } catch (e) {
      console.log(e);
      throw new Error(e.body);
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
