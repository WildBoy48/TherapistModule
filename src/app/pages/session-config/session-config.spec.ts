import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionConfig } from './session-config';

describe('SessionConfig', () => {
  let component: SessionConfig;
  let fixture: ComponentFixture<SessionConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
