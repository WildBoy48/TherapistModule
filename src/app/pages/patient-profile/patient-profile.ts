import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-profile.html',
  styleUrl: './patient-profile.css',
})
export class PatientProfile implements OnInit {
  patient: Patient | null = null;
  isEditing = false;
  editForm: Partial<Patient> = {};
  isEditingGoals = false;
  goalsForm = '';
  recentSessions: TherapySession[] = [
    { id: 's1', title: 'Upper Limb Mobility', date: 'Mar 15, 2026', duration: '35 min' },
    { id: 's2', title: 'Grip Strength Training', date: 'Mar 12, 2026', duration: '30 min' },
    { id: 's3', title: 'Shoulder Coordination', date: 'Mar 10, 2026', duration: '40 min' },
    { id: 's4', title: 'Fine Motor Practice', date: 'Mar 08, 2026', duration: '25 min' },
  ];

  constructor(
    private patientService: PatientService,
    private location: Location,
    private cdr: ChangeDetectorRef
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
      this.editForm = { ...this.patient };
      this.isEditing = true;
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editForm = {};
  }

  async savePatient(): Promise<void> {
    if (!this.patient) return;
    const updated: Patient = { ...this.patient, ...this.editForm };
    await this.patientService.updatePatient(updated);
    this.patient = updated;
    this.patientService.setSelectedPatient(updated);
    this.isEditing = false;
    this.editForm = {};
    this.cdr.markForCheck();
  }

  editGoals(): void {
    if (this.patient) {
      this.goalsForm = this.patient.rehabilitationGoals ?? '';
      this.isEditingGoals = true;
    }
  }

  cancelEditGoals(): void {
    this.isEditingGoals = false;
    this.goalsForm = '';
  }

  async saveGoals(): Promise<void> {
    if (!this.patient) return;
    const updated: Patient = { ...this.patient, rehabilitationGoals: this.goalsForm };
    await this.patientService.updatePatient(updated);
    this.patient = updated;
    this.patientService.setSelectedPatient(updated);
    this.isEditingGoals = false;
    this.goalsForm = '';
    this.cdr.markForCheck();
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
