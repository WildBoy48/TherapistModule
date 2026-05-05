import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MiniGameService, MiniGame } from '../../services/mini-game.service';
import { PatientService, Patient, PatientConfigDocument } from '../../services/patient.service';
import { GameStatsService } from '../../services/game-stats.service';

const SERVER_URL = `http://${window.location.hostname}:3000`;
const DEFAULT_PROFILE_IMAGE = '/imgs/profile.jpg';

@Component({
  selector: 'app-session-config',
  imports: [RouterLink, FormsModule],
  templateUrl: './session-config.html',
  styleUrl: './session-config.css',
})
export class SessionConfig implements OnInit, OnDestroy {
  selectedMiniGame: MiniGame | null = null;
  selectedPatient: Patient | null = null;
  patientImgSrc: string = DEFAULT_PROFILE_IMAGE;

  unityConnected = false;

  // Patient specific parameters
  selectedDevice = '';
  selectedLevel = '';
  seatHeight = 0.5;
  hapticFeedback = false;
  grippingTime: number | null = null;
  sessionDuration = 0;
  targetScore = 0;
  audioCues = false;
  visualCues = false;
  configLoaded = false;
  hasUnsavedChanges = false;
  currentConfigId: string | null = null;
  patientConfigExists = false;

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

    this.loadPatientParameters();
    
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

  onDeviceChange(): void {
    // Reset conditional fields when device changes
    this.hapticFeedback = false;
    this.grippingTime = null;
    this.markDirty();
  }

  ngOnDestroy(): void {
    this._connectionSub?.unsubscribe();
  }

  async loadPatientParameters(): Promise<void> {
    if (!this.selectedPatient || !this.selectedMiniGame) {
      this.configLoaded = false;
      return;
    }

    try {
      const config: PatientConfigDocument | null = await this.patientService.getPatientConfig(this.selectedPatient.id, this.selectedMiniGame.id);
      if (!config) {
        console.warn('No patient configuration found for', this.selectedPatient.id, this.selectedMiniGame.id);
        this.currentConfigId = null;
        this.patientConfigExists = false;
        this.configLoaded = false;
        this.hasUnsavedChanges = true;
        this.cdr.markForCheck();
        return;
      }

      this.currentConfigId = config.id;
      this.patientConfigExists = true;
      this.audioCues = config.audioCues ?? false;
      this.visualCues = config.visualCues ?? false;
      this.sessionDuration = config.sessionDuration ?? 0;
      this.targetScore = config.targetScore ?? 0;
      this.selectedDevice = config.device ?? '';
      this.selectedLevel = config.backgroundDetail != null ? config.backgroundDetail.toString() : '';
      this.seatHeight = config.seat ?? this.seatHeight;
      this.hapticFeedback = config.hapticFeedback ?? false;
      this.grippingTime = config.bci_minGripTime ?? null;
      this.configLoaded = true;
      this.hasUnsavedChanges = false;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading patient configuration:', error);
      this.currentConfigId = null;
      this.patientConfigExists = false;
      this.configLoaded = false;
      this.hasUnsavedChanges = false;
    }
  }

  markDirty(): void {
    if (this.selectedPatient && this.selectedMiniGame) {
      this.hasUnsavedChanges = true;
    }
  }

  async savePatientParameters(): Promise<void> {
    if (!this.selectedPatient || !this.selectedMiniGame) {
      console.warn('Cannot save patient parameters without a selected patient and mini-game.');
      return;
    }

    const config = {
      audioCues: this.audioCues,
      visualCues: this.visualCues,
      sessionDuration: this.sessionDuration,
      targetScore: this.targetScore,
      device: this.selectedDevice,
      backgroundDetail: this.selectedLevel ? Number(this.selectedLevel) : 0,
      seat: this.seatHeight,
      hapticFeedback: this.hapticFeedback,
      bci_minGripTime: this.grippingTime ?? 0,
    };

    try {
      if (this.currentConfigId) {
        await this.patientService.updatePatientConfig(this.currentConfigId, config);
        console.log('Patient parameters saved to document', this.currentConfigId);
      } else {
        const newConfigId = await this.patientService.createPatientConfig(
          this.selectedPatient.id,
          this.selectedMiniGame.id,
          config
        );
        this.currentConfigId = newConfigId;
        this.patientConfigExists = true;
        console.log('Created patient config document', newConfigId);
      }

      this.hasUnsavedChanges = false;
    } catch (error) {
      console.error('Error saving patient parameters:', error);
    }
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
