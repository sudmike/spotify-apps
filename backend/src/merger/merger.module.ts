import { Module } from '@nestjs/common';
import { MergerController } from './merger.controller';
import { SpotifyService } from '../services/spotify.service';

@Module({
  controllers: [MergerController],
  providers: [SpotifyService],
})
export class MergerModule {}
