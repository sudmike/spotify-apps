import { Component, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ArtistResponseFull } from '../../openapi';
import { EditComponent } from '../reusable/edit/edit.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.less'],
})
export class CreateComponent {
  submitLoading = false;
  @ViewChild(EditComponent) edit!: EditComponent;

  constructor(private api: ApiService, private readonly router: Router) {}

  /**
   * Submits playlist to be generated. Gets called on button press.
   */
  async onSubmit() {
    this.submitLoading = true;
    try {
      const artists: ArtistResponseFull[] = await this.edit.getArtistData();
      await this.api.submitPlaylist(artists);
      // ... notify about success
      await this.router.navigate(['dashboard']);
    } catch (e) {
      // ... handle error that the playlist could not be generated
    }
    this.submitLoading = false;
  }
}
