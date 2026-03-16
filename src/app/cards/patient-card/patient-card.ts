import { Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Patient } from '../../services/patient.service';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-patient-card',
  imports: [RouterLink],
  templateUrl: './patient-card.html',
  styleUrl: './patient-card.css',
})
export class PatientCard {
  @Input() patient!: Patient;
  @Input() isSelectable: boolean = false; // true when in patient-selector, false when in session-config

  constructor(
    private patientService: PatientService,
    private router: Router
  ) {}

  selectPatient(): void {
    if (this.isSelectable) {
      this.patientService.setSelectedPatient(this.patient);
      this.router.navigate(['/session-config']);
    }
  }

  goToProfile(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.patientService.setSelectedPatient(this.patient);
    this.router.navigate(['/patient-profile']);
  }
}
