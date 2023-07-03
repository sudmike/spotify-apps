import { Injectable } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import {
  DatabaseService,
  PlaylistArtistsData,
  PlaylistDataComplete,
} from './database.service';
import { LoggingService, LogKey } from './logging.service';

@Injectable()
export class BatchService {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly databaseService: DatabaseService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Refreshes all playlists that are scheduled to be updated.
   */
  async refreshAllPlaylists(): Promise<void> {
    const logId = this.loggingService.generateLogCorrelationId();
    this.startLog(logId, 'refresh');

    // fetch all playlists that should be refreshed
    const data = await this.databaseService.getAllPlaylists(true, true);
    if (!data) {
      this.logMessage(logId, 'Nothing to refresh');
      return;
    } else {
      this.logData(
        logId,
        'Fetched playlists to refresh',
        data.map((v) => ({ userId: v.user, playlistId: v.playlist.id })),
      );
    }

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

    this.logMessage(logId, 'Successfully refreshed all playlists');
  }

  /**
   * Checks all playlists for their existence and description/title.
   * @param detailsFlag Check playlist details like title and description.
   * @param artistFlag Check artists' playlists to make sure they are consistent.
   * @param forceFlag Update description and title even when default is found. This is useful for rare cases like an artist changing their name.
   */
  async checkAllPlaylists(
    detailsFlag: boolean,
    artistFlag: boolean,
    forceFlag: boolean,
  ): Promise<void> {
    const logId = this.loggingService.generateLogCorrelationId();
    this.startLog(logId, `check`);

    // fetch all playlists that should be checked
    const data = await this.databaseService.getAllPlaylists(false, false);
    if (!data) {
      this.logMessage(logId, 'Nothing to check');
      return;
    } else {
      this.logData(
        logId,
        'Fetched playlists to check',
        data.map((v) => ({ userId: v.user, playlistId: v.playlist.id })),
      );
    }

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

      // update descriptions and titles
      if (detailsFlag)
        for await (const playlist of playlists) {
          const updateEmptyDescription = playlist.details.description == '';
          const updateOriginalDescription = playlist.details.description
            .toLowerCase()
            .includes('this playlist was ');
          const updateDescription =
            updateEmptyDescription || (updateOriginalDescription && forceFlag);
          const updateTitle =
            playlist.details.name.toLowerCase().includes('these are ') &&
            forceFlag;

          if (updateDescription || updateTitle) {
            this.logData(logId, 'Regenerate playlist description or title', {
              playlistId: playlist.id,
              updateDescription,
              updateTitle,
            });
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

      // update artist playlists
      if (artistFlag)
        for await (const playlist of value) {
          let updateDatabase = false;
          const artists: PlaylistArtistsData = [];
          for await (const artistEntry of playlist.artists) {
            // check if this is playlist still exists
            const artistPlaylistExists =
              await this.spotifyService.doesPlaylistExist(artistEntry.playlist);

            // if this is playlist does not exist anymore update the entry, otherwise keep it
            if (!artistPlaylistExists) {
              updateDatabase = true;
              try {
                const artistName = (
                  await this.spotifyService.getArtistDetails([artistEntry.id])
                )[0].details.name;
                const artistPlaylistId = (
                  await this.spotifyService.searchArtist(artistName)
                ).artist?.playlist;

                this.logData(logId, `Update playlist id for artist`, {
                  artistId: artistEntry.id,
                  artistName,
                  oldPlaylistId: artistEntry.playlist,
                  newPlaylistId: artistPlaylistId,
                });

                // add modified artist entry
                artists.push({
                  ...artistEntry,
                  playlist: artistPlaylistId,
                });
              } catch (e) {
                // do not add artist entry
              }
            } else {
              // add normal artist entry
              artists.push(artistEntry);
            }
          }
          if (updateDatabase)
            await this.databaseService.setPlaylistArtists(playlist.id, artists);
        }

      this.logMessage(logId, 'Successfully checked all playlists');
    }
  }

  private startLog(id: string, operation: string) {
    this.loggingService.startCorrelatedLog(id, LogKey.BatchService, operation);
  }

  private logMessage(id: string, message: string) {
    this.loggingService.logCorrelatedData(id, message);
  }

  private logData(id: string, message: string, data: any) {
    this.loggingService.logCorrelatedData(id, message, data);
  }
}
