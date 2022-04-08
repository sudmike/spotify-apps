import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Param,
  Post,
  Query,
  Redirect,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PlaylistEntries, SpotifyService } from './services/spotify.service';
import { DatabaseService } from './services/database.service';
import { v5 as UUID } from 'uuid';
import { AuthGuard } from '../guards/auth.guard';
import { SpotifyTokenInterceptor } from './interceptors/spotify-token.interceptor';
import { IsArray, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

class SearchArtistSchema {
  @IsUUID()
  uuid: string;

  @IsNotEmpty()
  artist: string;
}

class SearchArtistAlternativesSchema {
  @IsUUID()
  uuid: string;

  @IsNotEmpty()
  artist: string;

  @IsNumber()
  offset: number;
}

class GeneratePlaylistSchema {
  @IsUUID()
  uuid: string;

  @IsArray()
  parts: PlaylistEntries[];
}

class GetPlaylistsSchema {
  @IsUUID()
  uuid: string;
}

class SetPlaylistActiveSchema {
  @IsUUID()
  uuid: string;
}

class SetPlaylistInactiveSchema {
  @IsUUID()
  uuid: string;
}

@Controller('merger')
export class MergerController {
  private spotifyScope = ['playlist-read-private', 'playlist-modify-private'];

  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get('login')
  @Redirect('https://spotify.com')
  getLogin() {
    const url = this.spotifyService.loginRedirect(this.spotifyScope);

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

    // get Spotify tokens
    const spotifyData = await this.spotifyService.callback(state, code);

    // generate a uuid based on the username
    const uuid = UUID(spotifyData.username, UUID.URL);

    // add user and refresh token to database
    await this.databaseService.addUser(uuid);
    await this.databaseService.updateSpotifyToken(
      uuid,
      spotifyData.refresh_token,
    );

    return { url: `${process.env.FRONTEND_REDIRECT_URI_SPOTIFY}?id=${uuid}` };
  }

  @Get('frontend')
  getFrontend() {
    return 'WOW look at this temporary frontend!';
  }

  @Get('artist')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async searchArtist(@Body() body: SearchArtistSchema) {
    return await this.spotifyService.searchArtist(body.artist);
  }

  @Get('artist/alternatives')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async searchArtistAlternatives(@Body() body: SearchArtistAlternativesSchema) {
    return await this.spotifyService.searchArtistAlternatives(
      body.artist,
      body.offset,
    );
  }

  @Post('playlists')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async generatePlaylist(@Body() body: GeneratePlaylistSchema) {
    // generate Spotify playlist
    const playlistId = await this.spotifyService.generatePlaylist(body.parts);

    // save information in database
    await this.databaseService.addUserPlaylist(
      playlistId,
      body.uuid,
      body.parts.map((entry) => entry.artist.id),
    );
    return playlistId;
  }

  @Get('playlists')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async getPlaylists(@Body() body: GetPlaylistsSchema) {
    let data = await this.databaseService.getUserPlaylists(body.uuid);

    const playlistIds: string[] = data.map((d) => d.id);
    const playlists = await this.spotifyService.getPlaylistDetails(
      playlistIds,
      (id) => {
        this.databaseService.removeUserPlaylist(id, body.uuid);
        data = data.filter((d) => d.id !== id);
      },
    );

    const artistIds: string[] = []
      .concat(...data.map((d) => d.artists))
      .filter((value, index, self) => self.indexOf(value) === index);
    const artists = await this.spotifyService.getArtistDetails(artistIds);

    // combine all data
    return data.map((entry) => {
      const playlist = playlists.at(
        playlists.findIndex((p) => p.id === entry.id),
      );
      const artist = entry.artists.map((artistId) => {
        const temp = artists.at(artists.findIndex((a) => a.id === artistId));
        return { id: temp.id, ...temp.details };
      });
      return {
        id: entry.id,
        active: entry.active,
        playlist: playlist.details,
        artists: artist,
      };
    });
  }

  @Post('playlists/:playlist/active')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async setPlaylistActive(
    @Param('playlist') playlist: string,
    @Body() body: SetPlaylistActiveSchema,
  ) {
    // await this.databaseService.setPlaylistActiveness(body.uuid, playlist, true);
    throw new NotImplementedException();
  }

  @Post('playlists/:playlist/inactive')
  @UseGuards(AuthGuard)
  @UseInterceptors(SpotifyTokenInterceptor)
  async setPlaylistInactive(
    @Param('playlist') playlist: string,
    @Body() body: SetPlaylistInactiveSchema,
  ) {
    // await this.databaseService.setPlaylistActiveness(body.uuid, playlist, false);
    throw new NotImplementedException();
  }
}
