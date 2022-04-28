import { Injectable } from '@angular/core';
import {
  ArtistResponse,
  GetPlaylistResponseSchema,
  MergerApiFactory,
} from '../../openapi';

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

  async searchArtist(name: string) {
    try {
      return (
        await this.api.mergerControllerSearchArtist(
          name,
          ApiService.getAuthorizationHeader(),
        )
      ).data;
    } catch (e) {
      throw new Error('Failed to search for artist');
    }
  }

  async searchArtistAlternatives(name: string) {
    try {
      return (
        await this.api.mergerControllerSearchArtistAlternatives(
          name,
          1,
          ApiService.getAuthorizationHeader(),
        )
      ).data;
    } catch (e) {
      throw new Error('Failed to search for artist alternatives');
    }
  }

  async submitPlaylist(artists: ArtistResponse[]) {
    try {
      await this.api.mergerControllerGeneratePlaylist(
        {
          parts: artists.map((artist) => ({
            playlist: artist.playlist,
            artist: { id: artist.id, name: artist.name },
            number: 20,
          })),
        },
        ApiService.getAuthorizationHeader(),
      );
    } catch (e) {
      throw new Error('Failed to generate playlist');
    }
  }

  private static getAuthorizationHeader() {
    const id = localStorage.getItem('id');
    if (id) return { headers: { Authorization: `Bearer ${id}` } };
    else throw new Error('Storage item id not set');
  }
}
