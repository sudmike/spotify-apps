import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SpotifyService } from '../services/spotify.service';
import { DatabaseService } from '../services/database.service';

@Injectable()
export class SpotifyTokenInterceptor implements NestInterceptor {
  private userCache: {
    id: string;
    refreshToken: string;
    accessToken: string;
    expiration: Date;
    timeoutHandler: NodeJS.Timeout;
  }[] = [];

  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly databaseService: DatabaseService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // should be available due to auth guard
    const uuid = request.headers.authorization.split('Bearer ').pop();

    if (request.method !== 'GET') {
      request.body = { ...request.body, uuid };
    } else {
      request.query = { ...request.query, uuid };
    }

    // get Spotify access token and set it
    try {
      const accessToken = await this.getAccessToken(uuid);
      this.spotifyService.setAccessToken(accessToken);
    } catch (e) {
      throw new UnauthorizedException(
        e,
        'Could not get Spotify token from user.',
      );
    }

    return next.handle();
  }

  private async getAccessToken(id: string) {
    const index = this.userCache.findIndex((tuple) => tuple.id === id);

    // get from database if there is no cache entry
    if (index < 0) {
      try {
        const user = await this.databaseService.getUserData(id);
        const refreshToken = user.refreshToken;

        const tokens = await this.spotifyService.getTokens(refreshToken);
        const accessToken = tokens.access_token;
        const expiration = new Date(Date.now() + 1000 * tokens.expires_in);
        const timeoutHandler = setTimeout(
          () => this.removeUser(user.id),
          1000 * tokens.expires_in + 1000 * 3600,
        );

        // add entry to user cache
        this.userCache.push({
          id,
          refreshToken,
          accessToken,
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
      const tuple = this.userCache.at(index);

      // use cached access token if it is still valid
      if (tuple.expiration > new Date(Date.now())) {
        return tuple.accessToken;
      }
      // refresh access token if it is expired
      else {
        const tokens = await this.spotifyService.getTokens(tuple.refreshToken);
        this.updateUserAccessToken(
          tuple.id,
          tokens.access_token,
          tokens.expires_in,
        );

        return tokens.access_token;
      }
    }
  }

  private removeUser(id: string) {
    const index = this.userCache.findIndex((tuple) => tuple.id === id);
    if (index > -1) this.removeUserAtIndex(index);
  }

  private removeUserAtIndex(index: number) {
    const tuple = this.userCache.at(index);
    if (tuple) {
      clearTimeout(tuple.timeoutHandler);
      this.userCache.splice(index);
    }
  }

  private updateUserAccessToken(
    id: string,
    accessToken: string,
    expiresInMs: number,
  ) {
    const index = this.userCache.findIndex((tuple) => tuple.id === id);
    if (index > -1) {
      const tuple = this.userCache.at(index);
      tuple.accessToken = accessToken;
      tuple.expiration = new Date(Date.now() + 1000 * expiresInMs);
      clearTimeout(tuple.timeoutHandler);
      tuple.timeoutHandler = setTimeout(
        () => this.removeUser(id),
        1000 * expiresInMs + 1000 * 3600,
      );
    }
  }
}
