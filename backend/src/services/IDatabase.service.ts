export abstract class IDatabaseService {
  /**
   * Initialize the database by passing credentials.
   * @param credentials The necessary credentials.
   */
  abstract initialize(credentials: any): void;

  /**
   * Adds a new entry to the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param data The data of the entry.
   */
  abstract addEntry(collection: string, id: string, data: any): void;
}
