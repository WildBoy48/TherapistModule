import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { MiniGameService, MiniGame } from '../../services/mini-game.service';
import { PatientService, Patient } from '../../services/patient.service';
import { GameStatsService } from '../../services/game-stats.service';

const SERVER_URL = `http://${window.location.hostname}:3000`;
const DEFAULT_PROFILE_IMAGE = '/imgs/profile.jpg';

@Component({
  selector: 'app-session-config',
  imports: [RouterLink],
  templateUrl: './session-config.html',
  styleUrl: './session-config.css',
})
export class SessionConfig implements OnInit, OnDestroy {
  selectedMiniGame: MiniGame | null = null;
  selectedPatient: Patient | null = null;
  patientImgSrc: string = DEFAULT_PROFILE_IMAGE;

  unityConnected = false;

  private _connectionSub: Subscription | null = null;

  constructor(
    private miniGameService: MiniGameService,
    private patientService: PatientService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private gameStats: GameStatsService
  ) {}

  ngOnInit(): void {
    this.selectedMiniGame = this.miniGameService.getSelectedMiniGame();
    this.selectedPatient = this.patientService.getSelectedPatient();
    if (this.selectedPatient?.profileImage && this.selectedPatient.profileImage.startsWith('ProfilePictures/')) {
      const filename = this.selectedPatient.profileImage.split('/')[1];
      this.patientImgSrc = `${SERVER_URL}/profile-pictures/${filename}`;
    } else {
      this.patientImgSrc = this.selectedPatient?.profileImage || DEFAULT_PROFILE_IMAGE;
    }
    
    this._connectionSub = this.gameStats.connected$.subscribe(connected => {
      this.unityConnected = connected;
      this.cdr.markForCheck();
    });
  }

  onPatientImageError(): void {
    this.patientImgSrc = DEFAULT_PROFILE_IMAGE;
    this.cdr.markForCheck();
  }

  changeMiniGame(): void {
    this.router.navigate(['/mini-game-selector']);
  }

  changePatient(): void {
    this.router.navigate(['/patient-selector']);
  }

  viewPatientProfile(): void {
    this.router.navigate(['/patient-profile']);
  }

  beginSession(): void {
    this.gameStats.sendCommand({ type: 'start_session' });
    this.router.navigate(['/therapy-session']);
  }

  cancelSession(): void {
    this._connectionSub?.unsubscribe();
    this._connectionSub = null;
    this.gameStats.disconnect();
  }

  getCalibrationDisabledReason(): string {
    if (!this.selectedMiniGame) {
      return 'Please select a mini-game first';
    }
    if (!this.unityConnected) {
      return 'Unity Server must be connected to calibrate';
    }
    return '';
  }

  isCalibrationDisabled(): boolean {
    return !this.selectedMiniGame || !this.unityConnected;
  }

  getBeginSessionDisabledReason(): string {
    if (!this.selectedMiniGame) {
      return 'Please select a mini-game first';
    }
    if (!this.selectedPatient) {
      return 'Please select a patient first';
    }
    if (!this.unityConnected) {
      return 'Unity Server must be connected to begin session';
    }
    return '';
  }

  isBeginSessionDisabled(): boolean {
    return !this.selectedMiniGame || !this.selectedPatient || !this.unityConnected;
  }

  ngOnDestroy(): void {
    this._connectionSub?.unsubscribe();
  }

  calibrateMiniGame(): void {
    if (!this.selectedMiniGame) {
      return;
    }

    this.gameStats.connect();
    this.gameStats.connected$
      .pipe(
        filter(connected => connected),
        take(1)
      )
      .subscribe(() => {
        this.gameStats.sendCommand({ type: 'load_scene', sceneID: this.selectedMiniGame!.sceneID });
      });
  }

  proceedToSession(): void {
    this.router.navigate(['/therapy-session']);
  }
}
