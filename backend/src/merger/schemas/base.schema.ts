import { IsUUID } from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';

export default class BaseSchema {
  @ApiHideProperty()
  @IsUUID()
  uuid: string;
}
