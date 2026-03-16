import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { PatientService, Patient } from '../../services/patient.service';

@Component({
  selector: 'app-patient-profile',
  imports: [CommonModule],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.css',
})
export class PatientProfile implements OnInit {
  patient: Patient | null = null;

  constructor(
    private patientService: PatientService,
    private location: Location
  ) {}

  ngOnInit(): void {
    // First, check if a patient was passed via navigation state
    const state = this.location.getState() as { patient?: Patient };
    if (state && state.patient) {
      this.patient = state.patient;
    } else {
      // Otherwise, use the selected patient from the service
      this.patient = this.patientService.getSelectedPatient();
    }
  }

  editPatient(): void {
    if (this.patient) {
      // TODO: Implement edit functionality
      console.log('Edit patient:', this.patient);
    }
  }

  editGoals(): void {
    if (this.patient) {
      // TODO: Implement edit goals functionality
      console.log('Edit goals for patient:', this.patient);
    }
  }
}
