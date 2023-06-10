import { Injectable } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { DatabaseService } from './database.service';

@Injectable()
export class BatchService {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly databaseService: DatabaseService,
  ) {}

  async refreshAllPlaylists(): Promise<void> {
    // fetch all playlists that should be refreshed
    const data = await this.databaseService.getAllPlaylists(true, true);
    if (!data) return;

    // refresh all playlists
    await this.spotifyService.regeneratePlaylists(
      data.map((entry) => ({
        user: entry.user,
        playlist: entry.playlist.id,
        entries: entry.playlist.artists,
      })),
      (user, playlist) => {
        // once a playlist is updated, write the update into the database
        this.databaseService.setPlaylistUpdated(user, playlist);
      },
    );
  }
}
