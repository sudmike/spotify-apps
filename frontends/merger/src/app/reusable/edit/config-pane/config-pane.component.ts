import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

export enum SongSplitType {
  equal,
  per_artist,
}

@Component({
  selector: 'app-config-pane',
  templateUrl: './config-pane.component.html',
  styleUrls: ['./config-pane.component.less'],
})
export class ConfigPaneComponent implements OnInit, OnChanges {
  @Input() active!: boolean;
  @Input() refreshFrequency!: number;
  refreshInterval: 'day' | 'week' = 'week';

  ngOnInit() {
    // ensure that refreshFrequency gets set
    if (!this.refreshFrequency) this.refreshFrequency = 7;
  }

  ngOnChanges(changes: SimpleChanges) {
    // potentially reformat days to weeks
    if (changes['refreshFrequency']) {
      if (this.refreshFrequency % 7 === 0) {
        this.refreshInterval = 'week';
        this.refreshFrequency /= 7;
      } else {
        this.refreshInterval = 'day';
      }
    }
  }

  getActive(): boolean {
    return this.active;
  }

  getFrequency(): number {
    return this.refreshInterval === 'week'
      ? 7 * +this.refreshFrequency
      : +this.refreshFrequency;
  }
}
