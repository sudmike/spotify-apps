import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtistPaneComponent } from './artist-pane.component';

describe('TableComponent', () => {
  let component: ArtistPaneComponent;
  let fixture: ComponentFixture<ArtistPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ArtistPaneComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArtistPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
