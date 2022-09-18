import { Injectable } from '@nestjs/common';
import { IDatabaseService } from '../IDatabase.service';
import admin, { ServiceAccount } from 'firebase-admin';
import { Database } from 'firebase-admin/lib/database';

@Injectable()
export abstract class IFirebaseService implements IDatabaseService {
  database: Database;

  initialize(credentials: ServiceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
      databaseURL: process.env.FIREBASE_URL_MASHUP,
    });

    this.database = admin.database();
  }

  async addEntry(collection: string, id: string, data: any): Promise<void> {
    const ref = this.database.ref(`${collection}/${id}`);
    try {
      await ref.set(data);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async getEntry(collection: string, id: string): Promise<any> {
    const ref = this.database.ref(`${collection}/${id}`);
    try {
      return (await ref.get()).val();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async updateEntry(collection: string, id: string, data: any): Promise<void> {
    const ref = this.database.ref(`${collection}/${id}`);
    try {
      await ref.update(data);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async removeEntry(collection: string, id: string): Promise<void> {
    const ref = this.database.ref(`${collection}/${id}`);
    try {
      await ref.remove();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async addEntryField(
    collection: string,
    id: string,
    field: string[],
    data: any,
  ): Promise<void> {
    const ref = this.database.ref(`${collection}/${id}/${path(field)}`);
    try {
      await ref.set(data);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async getEntryField(
    collection: string,
    id: string,
    field: string[],
  ): Promise<any> {
    const ref = this.database.ref(`${collection}/${id}/${path(field)}`);
    try {
      return (await ref.get()).val();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async updateEntryField(
    collection: string,
    id: string,
    field: string[],
    data: any,
  ): Promise<void> {
    const ref = this.database.ref(`${collection}/${id}/${path(field)}`);
    try {
      await ref.update(data);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async removeEntryField(
    collection: string,
    id: string,
    field: string[],
  ): Promise<void> {
    const ref = this.database.ref(`${collection}/${id}/${path(field)}`);
    try {
      await ref.remove();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}

function path(parts: string[]): string {
  let path = '';
  for (const [index, part] of parts.entries()) {
    path += part;
    if (index < parts.length - 1) path += '/';
  }
  return path;
}
