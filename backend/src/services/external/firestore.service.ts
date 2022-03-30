import { Injectable } from '@nestjs/common';
import { IDatabaseService } from '../IDatabase.service';
import admin, { ServiceAccount } from 'firebase-admin';
import { Database } from 'firebase-admin/lib/database';

@Injectable()
export class FirestoreService implements IDatabaseService {
  database: Database;

  initialize(credentials: ServiceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
      databaseURL: process.env.FIREBASE_URL_MERGER,
    });

    this.database = admin.database();
  }

  async addEntry(collection: string, id: string, data: any) {
    const ref = this.database.ref(`${collection}/${id}`);
    try {
      await ref.set(data);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
