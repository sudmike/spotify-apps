import { Injectable } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { DatabaseService, PlaylistDataComplete } from './database.service';

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

  async checkAllPlaylists(): Promise<void> {
    // fetch all playlists that should be checked
    const data = await this.databaseService.getAllPlaylists(false, false);
    if (!data) return;

    // batch playlists by user through a map
    const dataByUser: Map<string, PlaylistDataComplete[]> = new Map<
      string,
      PlaylistDataComplete[]
    >();
    for (const entry of data) {
      const field = dataByUser.get(entry.user);
      dataByUser.set(
        entry.user,
        field ? field.concat(entry.playlist) : [entry.playlist],
      );
    }

    // check all playlists for each user
    for (const [key, value] of dataByUser.entries()) {
      // set access token for user and get username
      await this.spotifyService.setAccessTokenByUserId(key);
      const username = await this.spotifyService.getUsernameByUserId(key);

      // get details of playlists including the description
      const playlists = await this.spotifyService.getPlaylistDetails(
        username,
        value.map((v) => v.id),
        (id) => {
          this.databaseService.removeUserPlaylist(id, key);
        },
      );

      // update descriptions if they are empty
      for (const playlist of playlists) {
        if (playlist.details.description == '') {
          // get artist names because they are necessary to generate the description
          const artistIDs = value
            .find((v) => v.id == playlist.id)
            .artists.map((a) => a.id);
          const artistDetails = await this.spotifyService.getArtistDetails(
            artistIDs,
          );
          const artistNames = artistDetails.map((a) => a.details.name);

          // update description of Spotify playlist
          await this.spotifyService.regenerateDescription(
            playlist.id,
            artistNames,
          );
        }
      }
    }
  }
}
