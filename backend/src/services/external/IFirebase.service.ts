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
      databaseURL: process.env.FIREBASE_URL_MERGER,
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
    field: string,
    data: any,
    subId?: string,
  ): Promise<void> {
    const ref = this.database.ref(
      `${collection}/${id}/${field}${subId ? `/${subId}` : ''}`,
    );
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
    field: string,
    subId?: string,
  ): Promise<any> {
    const ref = this.database.ref(
      `${collection}/${id}/${field}${subId ? `/${subId}` : ''}`,
    );
    try {
      return (await ref.get()).val();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async removeEntryField(
    collection: string,
    id: string,
    field: string,
    subId?: string,
  ): Promise<void> {
    const ref = this.database.ref(
      `${collection}/${id}/${field}${subId ? `/${subId}` : ''}`,
    );
    try {
      await ref.remove();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
