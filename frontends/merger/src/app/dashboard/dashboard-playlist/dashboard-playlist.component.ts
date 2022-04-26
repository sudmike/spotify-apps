import { Component, Input, OnInit } from '@angular/core';
import { GetPlaylistResponseSchema } from '../../../openapi';

@Component({
  selector: 'app-dashboard-playlist',
  templateUrl: './dashboard-playlist.component.html',
  styleUrls: ['./dashboard-playlist.component.less'],
})
export class DashboardPlaylistComponent implements OnInit {
  @Input() data!: GetPlaylistResponseSchema;

  constructor() {}

  ngOnInit(): void {}
}
