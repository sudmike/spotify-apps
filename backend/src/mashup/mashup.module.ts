import { Module } from '@nestjs/common';
import { MashupController } from './mashup.controller';
import { DatabaseService } from './services/database.service';
import { SpotifyService } from './services/spotify.service';
import { BatchService } from './services/batch.service';
import { LoggingService } from './services/logging.service';

@Module({
  controllers: [MashupController],
  providers: [SpotifyService, DatabaseService, BatchService, LoggingService],
})
export class MashupModule {}
