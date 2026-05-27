import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MiniGameService, MiniGame } from '../../services/mini-game.service';
import { PatientService, Patient, PatientConfigDocument } from '../../services/patient.service';
import { GameStatsService } from '../../services/game-stats.service';
import { ServerConfigService } from '../../services/server-config.service';

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
  seatHeight = 1.0;
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
  modeOverlay: 'calibration' | 'setup' | null = null;

  private _connectionSub: Subscription | null = null;
  private _messageSub: Subscription | null = null;

  constructor(
    private miniGameService: MiniGameService,
    private patientService: PatientService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private gameStats: GameStatsService,
    private serverConfig: ServerConfigService
  ) {}

  ngOnInit(): void {
    this.selectedMiniGame = this.miniGameService.getSelectedMiniGame();
    this.selectedPatient = this.patientService.getSelectedPatient();
    if (this.selectedPatient?.profileImage && this.selectedPatient.profileImage.startsWith('ProfilePictures/')) {
      const filename = this.selectedPatient.profileImage.split('/')[1];
      this.patientImgSrc = `${this.serverConfig.getBaseUrl()}/profile-pictures/${filename}`;
    } else {
      this.patientImgSrc = this.selectedPatient?.profileImage || DEFAULT_PROFILE_IMAGE;
    }

    this.loadPatientParameters();
    
    this._connectionSub = this.gameStats.connected$.subscribe(connected => {
      this.unityConnected = connected;
      if (!connected && this.modeOverlay !== null) {
        this.modeOverlay = null;
      }
      this.cdr.markForCheck();
    });

    this._messageSub = this.gameStats.messages$.subscribe(msg => {
      if (msg.type === 'export_parameters') {
        this.applyExportedParameters(msg.config);
      }
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

  cancelSession(): void {
    this._connectionSub?.unsubscribe();
    this._connectionSub = null;
    this.gameStats.disconnect();
  }

  getPatientParametersLoadDisabledReason(): string {
    if (!this.selectedPatient) {
      return 'Please select a patient first';
    }
    if (!this.selectedMiniGame) {
      return 'Please select a mini-game first';
    }
    if (!this.patientConfigExists) {
      return 'No saved parameters found for this patient and mini-game';
    }
    return '';
  }

    getPatientParametersSaveDisabledReason(): string {
    if (!this.selectedPatient) {
      return 'Please select a patient first';
    }
    if (!this.selectedMiniGame) {
      return 'Please select a mini-game first';
    }
    if (!this.hasUnsavedChanges) {
      return 'No unsaved changes to save';
    }
    return '';
  }

  getCalibrationDisabledReason(): string {
    if (!this.selectedMiniGame) {
      return 'Please select a mini-game first';
    }
    if (this.selectedDevice == '') {
      return 'Please select a device first';
    }
    if (!this.unityConnected) {
      return 'Unity Server must be connected to calibrate';
    }
    if (!this.selectedPatient) {
      return 'Please select a patient first';
    }
    return '';
  }

  isCalibrationDisabled(): boolean {
    return !this.selectedMiniGame || !this.unityConnected || this.selectedDevice == '' || !this.selectedPatient;
  }

  getSetupDisabledReason(): string {
    if (!this.selectedMiniGame) {
      return 'Please select a mini-game first';
    }
    if (!this.unityConnected) {
      return 'Unity Server must be connected to setup the game';
    }
    if (!this.selectedPatient) {
      return 'Please select a patient first';
    }
    return '';
  }

  isSetupDisabled(): boolean {
    return !this.selectedMiniGame || !this.unityConnected || !this.selectedPatient;
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
    if (this.selectedDevice == '') {
      return 'Please select a device first';
    }
    return '';
  }

  isBeginSessionDisabled(): boolean {
    return !this.selectedMiniGame || !this.selectedPatient || !this.unityConnected || this.selectedDevice == '';
  }

  onDeviceChange(): void {
    // Reset conditional fields when device changes
    this.hapticFeedback = false;
    this.grippingTime = null;
    this.markDirty();
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

  setupMiniGame(): void {
    if (!this.selectedMiniGame) {
      return;
    }

    const setupPayload = {
      type: 'load_scene',
      sceneID: this.selectedMiniGame.sceneID,
      mode: 'setup',
      miniGameID: this.selectedMiniGame.id,
      patientID: this.selectedPatient?.id ?? '',
      config: {
        backgroundDetail: this.selectedLevel ? Number(this.selectedLevel) : 1,
        seatHeight: this.seatHeight,
      },
    };

    this.gameStats.connect();
    this.gameStats.connected$
      .pipe(
        filter(connected => connected),
        take(1)
      )
      .subscribe(() => {
        this.gameStats.sendCommand(setupPayload);
        this.modeOverlay = 'setup';
      });
  }

  async saveSetupMode(): Promise<void> {
    // Call SaveSessionParameters() in MiniGameManager
    this.gameStats.sendCommand({ type: 'save_session_parameters' });
    // Do not close overlay or save patient parameters here —
    // wait for Unity to send back the updated parameters (export_parameters)
  }

  calibrateMiniGame(): void {
    if (!this.selectedMiniGame) {
      return;
    }

    const calibrationPayload = {
      type: 'load_scene',
      sceneID: this.selectedMiniGame.sceneID,
      mode: 'calibration',
      miniGameID: this.selectedMiniGame.id,
      patientID: this.selectedPatient?.id ?? '',
    };

    this.gameStats.connect();
    this.gameStats.connected$
      .pipe(
        filter(connected => connected),
        take(1)
      )
      .subscribe(() => {
        this.gameStats.sendCommand(calibrationPayload);
        this.modeOverlay = 'calibration';
      });
  }

  beginSession(): void {
    if (!this.selectedMiniGame) {
      return;
    }

    const sessionPayload = {
      type: 'load_scene',
      sceneID: this.selectedMiniGame.sceneID,
      mode: 'session',
      miniGameID: this.selectedMiniGame.id,
      patientID: this.selectedPatient?.id ?? '',
      config: {
        audioCues: this.audioCues,
        visualCues: this.visualCues,
        sessionDuration: this.sessionDuration,
        targetScore: this.targetScore,
        device: this.selectedDevice,
        backgroundDetail: this.selectedLevel ? Number(this.selectedLevel) : 0,
        seatHeight: this.seatHeight,
        hapticFeedback: this.hapticFeedback,
        bci_minGripTime: this.grippingTime ?? 0,
      },
    };

    this.gameStats.connect();
    this.gameStats.connected$
      .pipe(
        filter(connected => connected),
        take(1)
      )
      .subscribe(() => {
        this.gameStats.sendCommand(sessionPayload);
      });

    this.router.navigate(['/therapy-session']);
  }

  stopMode(): void {
    if (!this.unityConnected) {
      this.modeOverlay = null;
      return;
    }

    this.gameStats.sendCommand({ type: 'stop_mode' });
    this.modeOverlay = null;
  }

  private applyExportedParameters(config: Partial<import('../../services/patient.service').PatientConfig>): void {
    if (!config) {
      return;
    }

    // If we are in setup overlay, only update seat and background and close the overlay
    if (this.modeOverlay === 'setup') {
      this.selectedLevel = config.backgroundDetail != null ? String(config.backgroundDetail) : this.selectedLevel;

      // Unity may send a single-precision float which serializes with extra digits;
      // round to two decimals to match the UI slider precision
      const seatRaw = (config as any).seat ?? (config as any).seatHeight;
      if (seatRaw != null) {
        const seatNum = Number(seatRaw);
        if (!isNaN(seatNum)) {
          this.seatHeight = Math.round(seatNum * 100) / 100;
        }
      }

      this.hasUnsavedChanges = true;
      this.modeOverlay = null;
      this.cdr.markForCheck();
      return;
    }

    // Otherwise apply full exported configuration
    this.audioCues = config.audioCues ?? this.audioCues;
    this.visualCues = config.visualCues ?? this.visualCues;
    this.sessionDuration = config.sessionDuration ?? this.sessionDuration;
    this.targetScore = config.targetScore ?? this.targetScore;
    this.selectedDevice = config.device ?? this.selectedDevice;
    this.selectedLevel = config.backgroundDetail != null ? String(config.backgroundDetail) : this.selectedLevel;
    this.seatHeight = config.seat ?? this.seatHeight;
    this.hapticFeedback = config.hapticFeedback ?? this.hapticFeedback;
    this.grippingTime = config.bci_minGripTime ?? this.grippingTime;
    this.hasUnsavedChanges = true;
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this._connectionSub?.unsubscribe();
    this._messageSub?.unsubscribe();
  }
}
