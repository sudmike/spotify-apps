export abstract class IDatabaseService {
  /**
   * Adds a new entry to the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param data The data of the entry.
   */
  abstract addEntry(collection: string, id: string, data: any): void;

  /**
   * Adds a field to an entry in the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param field The field of the entry that something should be added to.
   * @param subId The ID of the entry that should be added to the field.
   * @param data The data the should be added.
   */
  abstract addEntryField(
    collection: string,
    id: string,
    field: string,
    subId: string,
    data: any,
  ): void;

  /**
   * Fetches an entry from the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   */
  abstract getEntry(collection: string, id: string): any;

  /**
   * Fetches a field of an entry from the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param field The field of the entry that should be fetched
   */
  abstract getEntryField(collection: string, id: string, field: string): any;

  /**
   * Updates an entry of the database. If the entry does not exist, it is created.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param data The data that should be updated.
   */
  abstract updateEntry(collection: string, id: string, data: any): void;

  /**
   * Removes a field from an entry in the database.
   * @param collection The path to a node.
   * @param id The id of the entry.
   * @param field The field of the entry that something should be removed from.
   * @param subId The ID of the entry that should be removed from the field.
   */
  abstract removeEntryField(
    collection: string,
    id: string,
    field: string,
    subId: string,
  ): void;
}
