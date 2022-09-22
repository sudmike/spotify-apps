import { IsBoolean, IsNotEmpty } from 'class-validator';
import SubmitPlaylistSchema from './submit-playlist.schema';

export default class UpdatePlaylistSchema extends SubmitPlaylistSchema {
  /**
   * Defines if the title of the playlist should be updated
   * @example true
   */
  @IsBoolean()
  @IsNotEmpty()
  updateTitle: boolean;

  /**
   * Defines if the description of the playlist should be updated
   * @example true
   */
  @IsBoolean()
  @IsNotEmpty()
  updateDescription: boolean;

  /**
   * Defines if the songs of the playlist should be updated
   * @example true
   */
  @IsBoolean()
  @IsNotEmpty()
  updateSongs: boolean;

  /**
   * Defines if the metadata of the playlist should be updated
   * @example true
   */
  @IsBoolean()
  @IsNotEmpty()
  updateMetadata: boolean;
}
