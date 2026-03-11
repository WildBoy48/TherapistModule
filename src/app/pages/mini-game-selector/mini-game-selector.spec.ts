import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniGameSelector } from './mini-game-selector';

describe('MiniGameSelector', () => {
  let component: MiniGameSelector;
  let fixture: ComponentFixture<MiniGameSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniGameSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(MiniGameSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
