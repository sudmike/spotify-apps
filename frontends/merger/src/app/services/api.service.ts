import { Injectable } from '@angular/core';
import { GetPlaylistResponseSchema, MergerApiFactory } from '../../openapi';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  api = MergerApiFactory(undefined, '/api');

  async checkAuth(): Promise<boolean> {
    try {
      await this.api.mergerControllerCheckAuth(
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
        await this.api.mergerControllerGetPlaylists(
          ApiService.getAuthorizationHeader(),
        )
      ).data;
    } catch (e) {
      // ... send out error
      throw new Error('Failed to get playlists');
    }
  }

  async getPlaylist(id: string): Promise<GetPlaylistResponseSchema> {
    try {
      return (
        await this.api.mergerControllerGetPlaylist(
          id,
          ApiService.getAuthorizationHeader(),
        )
      ).data;
    } catch (e) {
      // ... send out error
      throw new Error('Failed to get playlist');
    }
  }

  async regeneratePlaylist(id: string): Promise<void> {
    try {
      await this.api.mergerControllerRefreshPlaylist(
        id,
        ApiService.getAuthorizationHeader(),
      );
    } catch (e) {
      throw new Error('Failed to regenerate playlist');
    }
  }

  private static getAuthorizationHeader() {
    const id = localStorage.getItem('id');
    if (id) return { headers: { Authorization: `Bearer ${id}` } };
    else throw new Error('Storage item id not set');
  }
}
