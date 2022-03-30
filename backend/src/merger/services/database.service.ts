import { Injectable } from '@nestjs/common';
import { IFirebaseService } from '../../services/external/IFirebase.service';

@Injectable()
export class DatabaseService extends IFirebaseService {
  constructor() {
    super();
    import(`../${process.env.FIREBASE_CREDENTIALS_MERGER}.json`).then((res) => {
      super.initialize(res);
    });
  }

  /**
   * Add a user to the merger database.
   * @param id A UUID that identifies the user.
   * @param data The data that should be saved with the user.
   */
  async addUser(id: string, data: any): Promise<string> {
    try {
      await super.addEntry('users', id, data);
      return id;
    } catch (e) {
      throw e;
    }
  }
}
