/**
 * Shuffles items in an array with O(n) efficiency.
 * @param array The array of which the items should be shuffled.
 */
export function shuffleArray(array: any[]): any[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Returns text for a playlist title based on the artists that are passed in.
 * @param artists IDs of the artists.
 */
export function generatePlaylistTitle(artists: string[]): string {
  let playlistName = 'These are ';

  if (artists.length === 2) {
    playlistName += artists[0] + ' and ' + artists[1];
  } else if (artists.length === 3) {
    playlistName += artists[0] + ', ' + artists[1] + ' and ' + artists[2];
  } else {
    playlistName += artists[0] + ', ' + artists[1] + ' and others';
  }

  return playlistName;
}

/**
 * Returns text for a playlist description based on the artists that are passed in.
 * @param artists Names of the artists.
 */
export function generatePlaylistDescription(artists: string[]): string {
  artists = prepArtistsForDescription(artists);

  let playlistDescription =
    'This Playlist was auto-generated! ' + 'Artists are ' + artists[0];
  for (let i = 1; i < artists.length - 1; i++) {
    playlistDescription += ', ' + artists[i];
  }
  playlistDescription += ' and ' + artists[artists.length - 1] + '.';

  return playlistDescription;
}

/**
 * Sanitizes artist names by taking commas out of names (eg 'Tyler, the creator' to 'Tyler the creator') and optionally sorts names.
 * @param artists Names of the artists.
 * @param sort Defines if the names should be resorted.
 */
function prepArtistsForDescription(artists: string[], sort = false): string[] {
  for (let artist of artists) {
    // remove all comments
    artist = artist.replace(/,/g, '');
    artist = artist.replace(/ and /g, ' & ');
  }
  return sort ? artists.sort() : artists;
}

/**
 * Returns a subsection of tracks based on the position of the track.
 * @param tracks An array of tracks.
 * @param nrOfSongs The amount of tracks that should be returned.
 */
export function trimTrackSelection(
  tracks: string[],
  nrOfSongs: number,
): string[] {
  // No need to go through, if all will be returned anyway
  if (tracks.length <= nrOfSongs) {
    return tracks;
  } else {
    const tracksTrimmed = [];

    // Split Songs into categories based on popularity
    let hotTracks = tracks.slice(0, tracks.length * (1 / 6));
    let mediumTracks = tracks.slice(
      hotTracks.length,
      hotTracks.length + tracks.length * (1 / 4),
    );
    let coldTracks = tracks.slice(mediumTracks.length);

    // Shuffle Song pools once
    hotTracks = shuffleArray(hotTracks);
    mediumTracks = shuffleArray(mediumTracks);
    coldTracks = shuffleArray(coldTracks);

    // Randomly Select a song pool to add a song to the song list Hunger Games Style. Songs in hotter pools have a higher chance to be picked
    for (let i = 0; i < nrOfSongs; i++) {
      const randomRealm =
        hotTracks.length * 3 + mediumTracks.length * 2 + coldTracks.length;
      const randomSelection = Math.random() * randomRealm;

      // console.log('H:', hotTracks.length, ', M:', mediumTracks.length, ', C:', coldTracks.length, '. Realm: ', randomRealm, ', Selection: ', randomSelection)

      if (randomSelection <= hotTracks.length * 3) {
        tracksTrimmed.push(hotTracks.pop());
      } else if (
        randomSelection <=
        hotTracks.length * 3 + mediumTracks.length * 2
      ) {
        tracksTrimmed.push(mediumTracks.pop());
      } else {
        tracksTrimmed.push(coldTracks.pop());
      }
    }

    return tracksTrimmed;
  }
}
