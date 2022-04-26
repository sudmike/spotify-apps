import { Injectable } from '@angular/core';
import { MergerApiFactory } from '../../openapi';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  api = MergerApiFactory(undefined, '/api');

  async checkAuth(): Promise<boolean> {
    try {
      await this.api.mergerControllerCheckAuth({
        headers: ApiService.getAuthorizationHeader(),
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  private static getAuthorizationHeader() {
    const id = localStorage.getItem('id');
    if (id) return { Authorization: `Bearer ${id}` };
    else throw new Error('Storage item id not set');
  }
}
