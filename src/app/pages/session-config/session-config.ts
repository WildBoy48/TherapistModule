import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgClass } from '@angular/common';
import { MiniGameService, MiniGame } from '../../services/mini-game.service';
import { PatientService, Patient } from '../../services/patient.service';

const SERVER_URL = 'http://localhost:3000';
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
export class SessionConfig implements OnInit {
  selectedMiniGame: MiniGame | null = null;
  selectedPatient: Patient | null = null;
  patientImgSrc: string = DEFAULT_PROFILE_IMAGE;

  showSessionDialog = false;
  sessionLogs: LogEntry[] = [];
  sessionReady = false;

  constructor(
    private miniGameService: MiniGameService,
    private patientService: PatientService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.selectedMiniGame = this.miniGameService.getSelectedMiniGame();
    this.selectedPatient = this.patientService.getSelectedPatient();
    this.patientImgSrc = this.selectedPatient?.profileImage || DEFAULT_PROFILE_IMAGE;
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
        this.sessionLogs = [...this.sessionLogs, { message: 'Starting game...', status: 'pending' }];
        this.cdr.detectChanges();

        this.http.post(`${SERVER_URL}/start-game`, {}).subscribe({
          next: (res: any) => {
            this.setLog(1, res?.message ?? 'Game started successfully.', 'success');
            this.sessionReady = true;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.setLog(1, err?.error?.message ?? 'Failed to start game.', 'error');
          },
        });
      },
      error: () => {
        this.setLog(0, 'Could not reach local server. Make sure it is running.', 'error');
      },
    });
  }

  cancelSession(): void {
    this.http.post(`${SERVER_URL}/stop-game`, {}).subscribe({ error: () => {} });
    this.showSessionDialog = false;
    this.sessionLogs = [];
    this.sessionReady = false;
  }

  proceedToSession(): void {
    this.showSessionDialog = false;
    this.router.navigate(['/therapy-session']);
  }
}
