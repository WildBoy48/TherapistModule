import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { PatientService, Patient } from '../../services/patient.service';

interface TherapySession {
  id: string;
  title: string;
  date: string;
  duration: string;
}

@Component({
  selector: 'app-patient-profile',
  imports: [CommonModule],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.css',
})
export class PatientProfile implements OnInit {
  patient: Patient | null = null;
  recentSessions: TherapySession[] = [
    { id: 's1', title: 'Upper Limb Mobility', date: 'Mar 15, 2026', duration: '35 min' },
    { id: 's2', title: 'Grip Strength Training', date: 'Mar 12, 2026', duration: '30 min' },
    { id: 's3', title: 'Shoulder Coordination', date: 'Mar 10, 2026', duration: '40 min' },
    { id: 's4', title: 'Fine Motor Practice', date: 'Mar 08, 2026', duration: '25 min' },
  ];

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

  seeAllSessions(): void {
    // TODO: Navigate to full session history page when available.
    console.log('See all sessions for patient:', this.patient?.id);
  }

  repeatSession(sessionId: string): void {
    // TODO: Implement repeat session flow.
    console.log('Repeat session:', sessionId);
  }
}
