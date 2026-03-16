import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MiniGameService, MiniGame } from '../../services/mini-game.service';
import { PatientService, Patient } from '../../services/patient.service';

@Component({
  selector: 'app-session-config',
  imports: [RouterLink],
  templateUrl: './session-config.html',
  styleUrl: './session-config.css',
})
export class SessionConfig implements OnInit {
  selectedMiniGame: MiniGame | null = null;
  selectedPatient: Patient | null = null;

  constructor(
    private miniGameService: MiniGameService,
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.selectedMiniGame = this.miniGameService.getSelectedMiniGame();
    this.selectedPatient = this.patientService.getSelectedPatient();
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
}
