export abstract class IDatabaseService {
  /**
   * Adds a new entry to the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param data The data of the entry.
   */
  abstract addEntry(collection: string, id: string, data: any): void;

  /**
   * Fetches an entry from the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   */
  abstract getEntry(collection: string, id: string): any;

  /**
   * Updates an entry of the database. If the entry does not exist, it is created.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param data The data that should be updated.
   */
  abstract updateEntry(collection: string, id: string, data: any): void;

  /**
   * Removes an entry from the database.
   * @param collection
   * @param id
   */
  abstract removeEntry(collection: string, id: string): void;

  /**
   * Adds a field to an entry in the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param field The path parts to the field.
   * @param data The data that should be added.
   */
  abstract addEntryField(
    collection: string,
    id: string,
    field: string[],
    data: any,
  ): void;

  /**
   * Updates a field of an entry of the database. If the entry does not exist, it is created.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param field The path parts to the field
   * @param data The data that should be updated.
   */
  abstract updateEntryField(
    collection: string,
    id: string,
    field: string[],
    data: any,
  ): void;

  /**
   * Fetches a field of an entry from the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param field The path parts to the field.
   */
  abstract getEntryField(collection: string, id: string, field: string[]): any;

  /**
   * Removes a field from an entry in the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param field The path parts to the field.
   */
  abstract removeEntryField(
    collection: string,
    id: string,
    field: string[],
  ): void;
}
