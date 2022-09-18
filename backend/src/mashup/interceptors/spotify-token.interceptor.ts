import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SpotifyService } from '../services/spotify.service';

@Injectable()
export class SpotifyTokenInterceptor implements NestInterceptor {
  constructor(private readonly spotifyService: SpotifyService) {}

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
      await this.spotifyService.setAccessTokenByUserId(uuid);
    } catch (e) {
      throw new UnauthorizedException(
        e,
        'Could not get Spotify token from user.',
      );
    }

    return next.handle();
  }
}
