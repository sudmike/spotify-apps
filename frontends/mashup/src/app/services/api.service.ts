import { Injectable } from '@angular/core';
import {
  ArtistResponseFull,
  GetPlaylistResponseSchema,
  MashupApiFactory,
} from '../../openapi';
import { env } from '../../../env.dev';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  api = MashupApiFactory(undefined, env.production ? env.backendUrl : '/api');

  constructor(private notification: NotificationService) {}

  private static getAuthorizationHeader() {
    const id = localStorage.getItem('id');
    if (id) return { headers: { Authorization: `Bearer ${id}` } };
    else throw new Error('Storage item id not set');
  }

  private static checkForUnauthorizedException(e: any) {
    if (e.response.status === 401) {
      // if the token is invalid, remove it from the cache
      localStorage.removeItem('id');
      location.reload();
    }
  }

  async checkAuth(): Promise<boolean> {
    try {
      await this.api.mashupControllerCheckAuth(
        ApiService.getAuthorizationHeader(),
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  async getPlaylists(): Promise<GetPlaylistResponseSchema[]> {
    try {
      return (
        await this.api.mashupControllerGetPlaylists(
          ApiService.getAuthorizationHeader(),
        )
      ).data;
    } catch (e) {
      // send out error
      ApiService.checkForUnauthorizedException(e);
      this.notification.error('Failed to get playlists');
      throw new Error('Failed to get playlists');
    }
  }

  async getPlaylist(id: string): Promise<GetPlaylistResponseSchema> {
    try {
      return (
        await this.api.mashupControllerGetPlaylist(
          id,
          ApiService.getAuthorizationHeader(),
        )
      ).data;
    } catch (e) {
      // send out error
      ApiService.checkForUnauthorizedException(e);
      this.notification.error('Failed to get playlist');
      throw new Error('Failed to get playlist');
    }
  }

  async regeneratePlaylist(id: string): Promise<void> {
    try {
      await this.api.mashupControllerRefreshPlaylist(
        id,
        ApiService.getAuthorizationHeader(),
      );
    } catch (e) {
      // send out error
      ApiService.checkForUnauthorizedException(e);
      this.notification.error('Failed to regenerate playlist');
      throw new Error('Failed to regenerate playlist');
    }
  }

  async searchArtist(name: string) {
    try {
      return (
        await this.api.mashupControllerSearchArtist(
          name,
          ApiService.getAuthorizationHeader(),
        )
      ).data;
    } catch (e) {
      // send out error
      ApiService.checkForUnauthorizedException(e);
      this.notification.error('Failed to search for artist');
      throw new Error('Failed to search for artist');
    }
  }

  async submitPlaylist(
    artists: ArtistResponseFull[],
    active: boolean,
    frequency: number,
  ) {
    try {
      await this.api.mashupControllerGeneratePlaylist(
        {
          parts: artists,
          active,
          frequency,
          updateTitle: true,
          updateDescription: true,
        },
        ApiService.getAuthorizationHeader(),
      );
    } catch (e) {
      // send out error
      ApiService.checkForUnauthorizedException(e);
      this.notification.error('Failed to submit playlist');
      throw new Error('Failed to submit playlist');
    }
  }

  async updatePlaylist(
    id: string,
    artists: ArtistResponseFull[],
    active: boolean,
    frequency: number,
    updateTitle: boolean,
    updateDescription: boolean,
  ) {
    try {
      await this.api.mashupControllerUpdatePlaylist(
        id,
        {
          parts: artists,
          active,
          frequency,
          updateTitle,
          updateDescription,
        },
        ApiService.getAuthorizationHeader(),
      );
    } catch (e) {
      // send out error
      ApiService.checkForUnauthorizedException(e);
      this.notification.error('Failed to update playlist');
      throw new Error('Failed to update playlist');
    }
  }
}
