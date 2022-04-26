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
      return [];
    }
  }

  private static getAuthorizationHeader() {
    const id = localStorage.getItem('id');
    if (id) return { headers: { Authorization: `Bearer ${id}` } };
    else throw new Error('Storage item id not set');
  }
}
