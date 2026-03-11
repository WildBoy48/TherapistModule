import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniGameCard } from './mini-game-card';

describe('MiniGameCard', () => {
  let component: MiniGameCard;
  let fixture: ComponentFixture<MiniGameCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniGameCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MiniGameCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
