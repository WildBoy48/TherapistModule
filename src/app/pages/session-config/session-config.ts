import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { MiniGameService, MiniGame } from '../../services/mini-game.service';
import { PatientService, Patient } from '../../services/patient.service';
import { GameStatsService } from '../../services/game-stats.service';

const SERVER_URL = `http://${window.location.hostname}:3000`;
const DEFAULT_PROFILE_IMAGE = '/imgs/profile.jpg';

export type LogStatus = 'pending' | 'success' | 'error';

export interface LogEntry {
  message: string;
  status: LogStatus;
}

@Component({
  selector: 'app-session-config',
  imports: [RouterLink, NgClass],
  templateUrl: './session-config.html',
  styleUrl: './session-config.css',
})
export class SessionConfig implements OnInit, OnDestroy {
  selectedMiniGame: MiniGame | null = null;
  selectedPatient: Patient | null = null;
  patientImgSrc: string = DEFAULT_PROFILE_IMAGE;

  showSessionDialog = false;
  sessionLogs: LogEntry[] = [];
  sessionReady = false;

  private _connectionSub: Subscription | null = null;

  constructor(
    private miniGameService: MiniGameService,
    private patientService: PatientService,
    private router: Router,
    private http: HttpClient,
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

  private setLog(index: number, message: string, status: LogStatus): void {
    const updated = [...this.sessionLogs];
    updated[index] = { message, status };
    this.sessionLogs = updated;
    this.cdr.detectChanges();
  }

  beginSession(): void {
    this.sessionLogs = [{ message: 'Connecting to local server...', status: 'pending' }];
    this.sessionReady = false;
    this.showSessionDialog = true;

    this.http.get(`${SERVER_URL}/status`).subscribe({
      next: () => {
        this.setLog(0, 'Connected to local server.', 'success');
        this.sessionLogs = [...this.sessionLogs, { message: 'Waiting for Unity game...', status: 'pending' }];
        this.cdr.detectChanges();

        this.gameStats.connect();
        this._connectionSub = this.gameStats.connected$.subscribe(connected => {
          if (connected) {
            this.setLog(1, 'Unity game connected.', 'success');
            this.sessionReady = true;
            this.cdr.detectChanges();
            this._connectionSub?.unsubscribe();
            this._connectionSub = null;
          }
        });
      },
      error: () => {
        this.setLog(0, 'Could not reach local server. Make sure it is running.', 'error');
      },
    });
  }

  cancelSession(): void {
    this._connectionSub?.unsubscribe();
    this._connectionSub = null;
    this.gameStats.disconnect();
    this.showSessionDialog = false;
    this.sessionLogs = [];
    this.sessionReady = false;
  }

  ngOnDestroy(): void {
    this._connectionSub?.unsubscribe();
  }

  proceedToSession(): void {
    this.showSessionDialog = false;
    this.router.navigate(['/therapy-session']);
  }
}
