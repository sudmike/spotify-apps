import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Redirect,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SpotifyService } from './services/spotify.service';
import { DatabaseService } from './services/database.service';
import { v5 as UUID } from 'uuid';
import { AuthGuard } from '../guards/auth.guard';
import { SpotifyTokenInterceptor } from './interceptors/spotify-token.interceptor';
import SearchArtistSchema from './schemas/request/search-artist.schema';
import SearchArtistAlternativesSchema from './schemas/request/search-artist-alternative.schema';
import GeneratePlaylistSchema from './schemas/request/generate-playlist.schema';
import BaseSchema from './schemas/request/base.schema';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchArtistResponseSchema } from './schemas/response/search-artist-response.schema';
import { SearchArtistAlternativeResponseSchema } from './schemas/response/search-artist-alternative-response.schema';
import { GeneratePlaylistResponseSchema } from './schemas/response/generate-playlist-response.schema';
import { GetPlaylistResponseSchema } from './schemas/response/get-playlist-response.schema';
import * as crypto from 'crypto';

@ApiTags('merger')
@ApiBearerAuth()
@ApiForbiddenResponse()
@Controller('merger')
export class MergerController {
  private spotifyScope = ['playlist-read-private', 'playlist-modify-private'];

  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get('login')
  @Redirect('https://spotify.com')
  @ApiExcludeEndpoint()
  getLogin() {
    const url = this.spotifyService.loginRedirect(this.spotifyScope);

    return { url };
  }

  @Get('login/callback')
  @Redirect()
  @ApiExcludeEndpoint()
  async getCallback(@Query('state') state, @Query('code') code) {
    // check that query parameters are present
    if (!state || !code) {
      throw new UnauthorizedException(
        undefined,
        'OAuth callback was unsuccessful or the user denied consent.',
      );
    }

    // get Spotify tokens
    const spotifyData = await this.spotifyService.callback(state, code);

    // generate a uuid based on the username
    const hash = crypto
      .createHash('sha1')
      .update(UUID.URL + process.env.UUID_SALT_MERGER)
      .digest('hex');
    const uuid = UUID(hash, UUID.URL);

    // add user and refresh token to database
    await this.databaseService.addUser(uuid);
    await this.databaseService.updateSpotifyToken(
      uuid,
      spotifyData.refresh_token,
    );

    return { url: `${process.env.FRONTEND_REDIRECT_URI}?id=${uuid}` };
  }

  @Get('frontend')
  @ApiExcludeEndpoint()
  getFrontend() {
    return 'WOW look at this temporary frontend!';
  }

  @Post('auth')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async checkAuth() {
    // guard and interceptor do the checking
  }

  @Get('artist')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async searchArtist(
    @Query() query: SearchArtistSchema,
  ): Promise<SearchArtistResponseSchema> {
    return await this.spotifyService.searchArtist(query.name);
  }

  @Get('artist/alternatives')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async searchArtistAlternatives(
    @Query() query: SearchArtistAlternativesSchema,
  ): Promise<SearchArtistAlternativeResponseSchema> {
    return await this.spotifyService.searchArtistAlternatives(
      query.name,
      query.offset,
    );
  }

  @Post('playlists')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async generatePlaylist(
    @Body() body: GeneratePlaylistSchema,
  ): Promise<GeneratePlaylistResponseSchema> {
    // generate Spotify playlist
    const id = await this.spotifyService.generatePlaylist(body.parts);

    // save information in database
    await this.databaseService.addUserPlaylist(
      id,
      body.uuid,
      body.parts.map((entry) => ({
        id: entry.artist.id,
        playlist: entry.playlist,
        number: entry.number,
      })),
    );

    return { id };
  }

  @Post('playlists/:playlist/refresh')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async refreshPlaylist(
    @Param('playlist') playlist: string,
    @Body() body: BaseSchema | any,
  ): Promise<void> {
    // get generation related data from database
    const data = await this.databaseService.getPlaylistArtists(
      playlist,
      body.uuid,
    );

    // regenerate Spotify playlist
    await this.spotifyService.regeneratePlaylist(
      playlist,
      data.map((entry) => ({ playlist: entry.playlist, number: entry.number })),
    );

    // set last updated time in database
    await this.databaseService.setPlaylistUpdated(body.uuid, playlist);
  }

  @Get('playlists/:playlist')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async getPlaylist(
    @Query() query: BaseSchema,
    @Param('playlist') playlist: string,
  ): Promise<GetPlaylistResponseSchema> {
    const data = await this.databaseService.getUserPlaylist(
      query.uuid,
      playlist,
    );

    const playlists = await this.spotifyService.getPlaylistDetails(
      [playlist],
      (id) => {
        this.databaseService.removeUserPlaylist(id, query.uuid);
      },
    );

    if (playlists.length === 0)
      throw new NotFoundException(undefined, 'The playlist could not be found');
    else {
      const singlePlaylist = playlists.at(0);
      const artistIds = data.artists.map((artist) => artist.id);
      const artists = await this.spotifyService.getArtistDetails(artistIds);

      return {
        id: data.id,
        active: data.active,
        playlist: singlePlaylist.details,
        artists: artists.map((artist) => ({
          id: artist.id,
          name: artist.details.name,
          images: artist.details.images,
        })),
      };
    }
  }

  @Get('playlists')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async getPlaylists(
    @Query() query: BaseSchema,
  ): Promise<GetPlaylistResponseSchema[]> {
    let data = await this.databaseService.getUserPlaylists(query.uuid);

    const playlistIds: string[] = data.map((d) => d.id);
    const playlists = await this.spotifyService.getPlaylistDetails(
      playlistIds,
      (id) => {
        this.databaseService.removeUserPlaylist(id, query.uuid);
        data = data.filter((d) => d.id !== id);
      },
    );

    const artistIds: string[] = []
      .concat(...data.map((d) => d.artists.map((a) => a.id)))
      .filter((value, index, self) => self.indexOf(value) === index);
    const artistsRes = await this.spotifyService.getArtistDetails(artistIds);

    // combine all data
    return data.map((entry) => {
      const playlist = playlists.at(
        playlists.findIndex((p) => p.id === entry.id),
      );
      const artists = entry.artists.map((artistId) => {
        const temp = artistsRes.at(
          artistsRes.findIndex((a) => a.id === artistId.id),
        );
        return { id: temp.id, ...temp.details };
      });
      return {
        id: entry.id,
        active: entry.active,
        playlist: playlist.details,
        artists,
      };
    });
  }

  @Post('playlists/:playlist/active')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async setPlaylistActive(
    @Param('playlist') playlist: string,
    @Body() body: BaseSchema | any,
  ) {
    await this.databaseService.setPlaylistActiveness(body.uuid, playlist, true);
  }

  @Post('playlists/:playlist/inactive')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async setPlaylistInactive(
    @Param('playlist') playlist: string,
    @Body() body: BaseSchema | any,
  ) {
    await this.databaseService.setPlaylistActiveness(
      body.uuid,
      playlist,
      false,
    );
  }
}
