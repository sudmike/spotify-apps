import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SongNumberPaneComponent } from './song-number-pane.component';

describe('SongNumberPaneComponent', () => {
  let component: SongNumberPaneComponent;
  let fixture: ComponentFixture<SongNumberPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SongNumberPaneComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SongNumberPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
