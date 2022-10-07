import {
  Component,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NotificationService } from '../../../services/notification.service';
import { MatTooltip } from '@angular/material/tooltip';

export enum SongSplitType {
  equal,
  per_artist,
}

@Component({
  selector: 'app-config-pane',
  templateUrl: './config-pane.component.html',
  styleUrls: ['./config-pane.component.less'],
})
export class ConfigPaneComponent implements OnChanges {
  @Input() active!: boolean;
  @Input() refreshFrequency!: number;
  refreshInterval: 'day' | 'week' = 'week';

  constructor(private notification: NotificationService) {}

  triggerTooltip(tooltip: MatTooltip) {
    tooltip.show();
    setTimeout(() => tooltip.hide(), 2000);
  }

  ngOnChanges(changes: SimpleChanges) {
    // potentially reformat days to weeks
    if (changes['refreshFrequency']) {
      if (!changes['refreshFrequency'].currentValue) this.refreshFrequency = 7;
      if (this.refreshFrequency % 7 === 0) {
        this.refreshInterval = 'week';
        this.refreshFrequency /= 7;
      } else {
        this.refreshInterval = 'day';
      }
    }
  }

  getActive(): boolean {
    return this.active ? this.active : false;
  }

  getFrequency(): number {
    if (isNaN(this.refreshFrequency) || this.refreshFrequency < 1) {
      this.notification.warning('Refresh frequency is not valid');
      return NaN;
    } else
      return this.refreshInterval === 'week'
        ? 7 * +this.refreshFrequency
        : +this.refreshFrequency;
  }

  /**
   * Checks that number input fields are numeric.
   * @param event The OnKeyDown event.
   */
  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    if (
      (event.key.length === 1 && !/^\d$/.test(event.key)) ||
      event.key === 'Process' ||
      event.key === 'Dead'
    ) {
      event.preventDefault();
    }
  }
}
