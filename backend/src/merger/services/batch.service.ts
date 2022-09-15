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
    const data = await this.databaseService.getAllActivePlaylists();
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

  // Cache Idea: cache This Is XYZ content to prevent unnecessary requests to Spotify
  //   1. Prepare cache
  //     1.a. Go through 'This Is XXX' IDs and write a hashmap of ID and number of occurrences
  //     1.b. Remove all entries with only one occurrence and all except top X
  //     1.c. Log number of total playlists, number of entries with multiple occurrences and expected hit rate
  //   2. Fetch over cache
  //     2.a. If playlist is not marked in cache fetch it normally
  //     2.b. If playlist is marked in cache but not in cache, fetch it and write it into the cache
  //     2.c. If playlist is in cache, take it from the cache
  //     4.d. Always log if it was a cache hit or miss
  //   3 Write out number of duplicates, "hit rate", etc

  /*
    cache = new Map<
      string,
      {
        occurrences: number;
        totalOccurrences: number;
        tracks: any;
      }
    >();
  */

  /*
    private initializeCache(entries: RefreshItemExtended[]): void {
      // write a new cache entry or update an existing one for every 'This Is XYZ' playlist ID
      for (const entry of entries) {
        for (const playlist of entry.playlists) {
          for (const artist of playlist.artists) {
            console.log(artist);
            const cacheVal = this.cache.get(artist.playlist);
            if (cacheVal) {
              this.cache.set(artist.playlist, {
                ...cacheVal,
                totalOccurrences: cacheVal.totalOccurrences + 1,
              });
            } else {
              this.cache.set(artist.playlist, {
                totalOccurrences: 1,
                occurrences: 0,
                tracks: undefined,
              });
            }
          }
        }
      }
  
      // cut back on entries with only one occurrence
      for (const [key, value] of this.cache) {
        if (value.totalOccurrences < 2) {
          this.cache.delete(key);
        }
      }
    }
  */
}
