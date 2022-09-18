export class MetadataResponse {
  /**
   * Timestamp of last update
   * @example 1661433338296
   */
  updated: number;

  /**
   * Timestamp of creation
   * @example 1661433338296
   */
  created: number;

  /**
   * Defines if playlist refreshing is set to active or not
   * @example true
   */
  active: boolean;

  /**
   * Refresh playlist every X days
   * @example 7
   */
  frequency: number;
}
