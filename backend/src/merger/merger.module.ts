import { Module } from '@nestjs/common';
import { MergerController } from './merger.controller';
import { SpotifyService } from '../services/spotify.service';
import { DatabaseService } from './services/database.service';

@Module({
  controllers: [MergerController],
  providers: [SpotifyService, DatabaseService],
})
export class MergerModule {}
