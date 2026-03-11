import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TherapySession } from './therapy-session';

describe('TherapySession', () => {
  let component: TherapySession;
  let fixture: ComponentFixture<TherapySession>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TherapySession],
    }).compileComponents();

    fixture = TestBed.createComponent(TherapySession);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
