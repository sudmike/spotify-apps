import { Module } from '@nestjs/common';
import { MergerController } from './merger.controller';
import { DatabaseService } from './services/database.service';
import { SpotifyService } from './services/spotify.service';

@Module({
  controllers: [MergerController],
  providers: [SpotifyService, DatabaseService],
})
export class MergerModule {}
