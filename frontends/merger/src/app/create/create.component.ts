import { Component, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ArtistResponseFull } from '../../openapi';
import { EditComponent } from '../reusable/edit/edit.component';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.less'],
})
export class CreateComponent {
  submitLoading = false;
  @ViewChild(EditComponent) edit!: EditComponent;

  constructor(
    private title: TitleService,
    private api: ApiService,
    private readonly router: Router,
    private notification: NotificationService,
  ) {
    this.title.setTitle('Create');
  }

  /**
   * Submits playlist to be generated. Gets called on button press.
   */
  async onSubmit() {
    this.submitLoading = true;
    try {
      const artists: ArtistResponseFull[] = this.edit.getArtistData();
      const active: boolean = this.edit.getActive();
      const frequency: number = this.edit.getFrequency();
      if (artists.length > 0 && !isNaN(frequency)) {
        await this.api.submitPlaylist(artists, active, frequency);
        this.notification.success('Successfully created playlist');
        await this.router.navigate(['dashboard']);
      }
    } catch (e) {
      this.notification.error('Failed to create playlist');
    }
    this.submitLoading = false;
  }
}
