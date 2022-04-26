import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPlaylistComponent } from './dashboard-playlist.component';

describe('DashboardPlaylistComponent', () => {
  let component: DashboardPlaylistComponent;
  let fixture: ComponentFixture<DashboardPlaylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardPlaylistComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardPlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
