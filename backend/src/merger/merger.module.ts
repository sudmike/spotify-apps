import { Module } from '@nestjs/common';
import { MergerController } from './merger.controller';
import { SpotifyService } from '../services/spotify.service';
import { FirestoreService } from '../services/external/firestore.service';
import { IDatabaseService } from '../services/IDatabase.service';

@Module({
  controllers: [MergerController],
  providers: [
    SpotifyService,
    { provide: IDatabaseService, useClass: FirestoreService },
  ],
})
export class MergerModule {}
