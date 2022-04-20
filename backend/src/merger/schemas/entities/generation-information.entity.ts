import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export default class GenerationInformationEntity {
  /**
   * The ID of the 'This is XYZ' playlist
   * @example 37i9dQZF1DZ06evO3nMr04
   */
  @IsString()
  @IsNotEmpty()
  playlist: string;

  /**
   * The number of songs that should be added from the artists 'This is XYZ' playlist
   * @example 20
   */
  @IsNumber()
  @IsNotEmpty()
  number: number;
}
