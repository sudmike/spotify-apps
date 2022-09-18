import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
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
import SubmitPlaylistSchema from './schemas/request/submit-playlist.schema';
import BaseSchema from './schemas/request/base.schema';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchArtistResponseSchema } from './schemas/response/search-artist-response.schema';
import { GeneratePlaylistResponseSchema } from './schemas/response/generate-playlist-response.schema';
import { GetPlaylistResponseSchema } from './schemas/response/get-playlist-response.schema';
import * as crypto from 'crypto';
import { BatchService } from './services/batch.service';

@ApiTags('mashup')
@ApiBearerAuth()
@ApiForbiddenResponse()
@Controller('mashup')
export class MashupController {
  private spotifyScope = [
    'playlist-read-private',
    'playlist-modify-private',
    'playlist-modify-public',
  ];

  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly databaseService: DatabaseService,
    private readonly refreshService: BatchService,
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
      .update(spotifyData.username + process.env.UUID_SALT_MASHUP)
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

  @Post('refresh')
  @ApiExcludeEndpoint()
  async refreshPlaylists() {
    await this.refreshService.refreshAllPlaylists();
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

  @Post('playlists')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async generatePlaylist(
    @Body() body: SubmitPlaylistSchema,
  ): Promise<GeneratePlaylistResponseSchema> {
    // generate Spotify playlist
    const id = await this.spotifyService.generatePlaylist(body.parts);

    // save information in database
    await this.databaseService.addUserPlaylist(
      id,
      body.uuid,
      body.parts.map((entry) => ({
        id: entry.id,
        playlist: entry.playlist,
        number: entry.number,
      })),
      body.active,
      body.frequency,
    );

    return { id };
  }

  @Put('playlists/:playlist')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async updatePlaylist(
    @Param('playlist') playlist: string,
    @Body() body: SubmitPlaylistSchema,
  ): Promise<GeneratePlaylistResponseSchema> {
    // generate Spotify playlist
    const id = await this.spotifyService.updatePlaylist(
      playlist,
      body.parts,
      body.updateTitle,
      body.updateDescription,
    );

    // save information in database
    await this.databaseService.updateUserPlaylist(
      id,
      body.uuid,
      body.parts.map((entry) => ({
        id: entry.id,
        playlist: entry.playlist,
        number: entry.number,
      })),
      body.active,
      body.frequency,
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
        playlist: singlePlaylist.details,
        artists: artists.map((artist) => ({
          id: artist.id,
          name: artist.details.name,
          images: artist.details.images,
          playlist: data.artists.find((a) => a.id === artist.id)?.playlist,
          number: data.artists.find((a) => a.id === artist.id)?.number,
        })),
        metadata: {
          updated: data.updated,
          created: data.created,
          active: data.active,
          frequency: data.frequency,
        },
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

    // combine all data
    return data.map((entry) => {
      const playlist = playlists.at(
        playlists.findIndex((p) => p.id === entry.id),
      );
      return {
        id: entry.id,
        playlist: playlist.details,
        artists: [],
        metadata: {
          updated: entry.updated,
          created: entry.created,
          active: entry.active,
          frequency: entry.frequency,
        },
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
