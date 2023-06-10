import { Injectable } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { DatabaseService, PlaylistDataComplete } from './database.service';

@Injectable()
export class BatchService {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Refreshes all playlists that are scheduled to be updated.
   */
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

  /**
   * Checks all playlists for their existence and description/title.
   * @param bold Update description and title even when default is found. This is useful for rare cases like an artist changing their name.
   */
  async checkAllPlaylists(bold: boolean): Promise<void> {
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

      for (const playlist of playlists) {
        // check if description and title need to be updated
        const updateEmptyDescription = playlist.details.description == '';
        const updateOriginalDescription = playlist.details.description
          .toLowerCase()
          .includes('this playlist was auto-generated! artists are');
        const updateDescription =
          updateEmptyDescription || (updateOriginalDescription && bold);
        const updateTitle =
          playlist.details.name.toLowerCase().includes('these are ') && bold;

        if (updateDescription || updateTitle) {
          // get artist names because they are necessary to generate the description
          const artistIDs = value
            .find((v) => v.id == playlist.id)
            .artists.map((a) => a.id);
          const artistDetails = await this.spotifyService.getArtistDetails(
            artistIDs,
          );
          const artistNames = artistDetails.map((a) => a.details.name);

          await this.spotifyService.regenerateDetails(
            playlist.id,
            artistNames,
            updateTitle,
            updateDescription,
          );
        }
      }
    }
  }
}
