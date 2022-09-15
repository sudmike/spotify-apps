import { Module } from '@nestjs/common';
import { MergerController } from './merger.controller';
import { DatabaseService } from './services/database.service';
import { SpotifyService } from './services/spotify.service';
import { BatchService } from './services/batch.service';

@Module({
  controllers: [MergerController],
  providers: [SpotifyService, DatabaseService, BatchService],
})
export class MergerModule {}
