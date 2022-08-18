import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { ArtistResponseSimple, PlaylistsResponse } from '../../openapi';
import { EditComponent } from '../reusable/edit/edit.component';

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.less'],
})
export class PlaylistComponent implements OnInit {
  templateTableArtists: ArtistResponseSimple[] = [];

  id: string | undefined;
  playlist: PlaylistsResponse | undefined;
  artists: ArtistResponseSimple[] | undefined;
  @ViewChild(EditComponent) edit!: EditComponent;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async (params) => {
      const id = params['id'];

      if (id) {
        const res = await this.api.getPlaylist(id);
        this.id = res.id;
        this.playlist = res.playlist;
        this.artists = res.artists;

        this.templateTableArtists = this.artists;
      }
    });
  }
}
