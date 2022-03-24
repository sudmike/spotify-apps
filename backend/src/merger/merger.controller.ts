import {
  Controller,
  Get,
  Query,
  Redirect,
  UnauthorizedException,
} from '@nestjs/common';
import { SpotifyService } from '../services/spotify.service';

@Controller('merger')
export class MergerController {
  private spotifyCredentials = {
    clientId: process.env.SPOTIFY_CLIENT_ID_MERGER,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET_MERGER,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI_MERGER,
  };
  private spotifyScope = ['playlist-read-private', 'playlist-modify-private'];

  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('login')
  @Redirect('https://spotify.com')
  getLogin() {
    const url = this.spotifyService.loginRedirect(
      this.spotifyCredentials,
      this.spotifyScope,
    );

    return { url };
  }

  @Get('login/callback')
  @Redirect()
  async getCallback(@Query('state') state, @Query('code') code) {
    // check that query parameters are present
    if (!state || !code) {
      throw new UnauthorizedException(
        undefined,
        'OAuth callback was unsuccessful or the user denied consent.',
      );
    }

    const spotifyData = await this.spotifyService.callback(
      this.spotifyCredentials,
      state,
      code,
    );

    console.log(spotifyData);

    return { url: process.env.FRONTEND_REDIRECT_URI_SPOTIFY };
  }

  @Get('frontend')
  getFrontend() {
    return 'WOW look at this temporary frontend!';
  }
}
