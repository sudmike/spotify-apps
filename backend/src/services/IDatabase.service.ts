export abstract class IDatabaseService {
  /**
   * Adds a new entry to the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param data The data of the entry.
   */
  abstract addEntry(collection: string, id: string, data: any): void;

  /**
   * Updates an entry of the database. If the entry does not exist, it is created.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param data The data that should be updated.
   */
  abstract updateEntry(collection: string, id: string, data: any): void;

  /**
   * Fetches an entry from the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   */
  abstract getEntry(collection: string, id: string): any;
}
