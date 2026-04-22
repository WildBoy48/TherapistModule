import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PatientService, Patient } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';

const LOCAL_SERVER = `http://${window.location.hostname}:3000`;

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
  private readonly defaultProfileImage = '/imgs/profile.jpg';

  patient: Patient | null = null;
  profileImageSrc: string = this.defaultProfileImage;
  isEditing = false;
  editForm: Partial<Patient> = {};
  isCreatingProfile = false;
  formError: string | null = null;
  isEditingGoals = false;
  goalsForm = '';
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  recentSessions: TherapySession[] = [
    { id: 's1', title: 'Upper Limb Mobility', date: 'Mar 15, 2026', duration: '35 min' },
    { id: 's2', title: 'Grip Strength Training', date: 'Mar 12, 2026', duration: '30 min' },
    { id: 's3', title: 'Shoulder Coordination', date: 'Mar 10, 2026', duration: '40 min' },
    { id: 's4', title: 'Fine Motor Practice', date: 'Mar 08, 2026', duration: '25 min' },
  ];

  constructor(
    private patientService: PatientService,
    private location: Location,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // First, check if a patient was passed via navigation state
    const state = this.location.getState() as { patient?: Patient; createNew?: boolean };
    if (state?.createNew) {
      this.initializeNewPatientForm();
      return;
    }

    if (state && state.patient) {
      this.patient = state.patient;
    } else {
      // Otherwise, use the selected patient from the service
      this.patient = this.patientService.getSelectedPatient();
    }
    this.syncProfileImageSrc();
  }

  private syncProfileImageSrc(): void {
    if (this.patient?.profileImage && this.patient.profileImage.startsWith('ProfilePictures/')) {
      const filename = this.patient.profileImage.split('/')[1];
      this.profileImageSrc = `${LOCAL_SERVER}/profile-pictures/${filename}`;
    } else {
      this.profileImageSrc = this.patient?.profileImage || this.defaultProfileImage;
    }
  }

  private initializeNewPatientForm(): void {
    this.isCreatingProfile = true;
    this.isEditing = true;
    this.formError = null;
    this.patient = {
      id: '',
      name: '',
      gender: '',
      age: 0,
      handedness: '',
      diagnosis: '',
      profileImage: this.defaultProfileImage,
      therapistId: '',
      rehabilitationGoals: '',
    };
    this.syncProfileImageSrc();
    this.editForm = {
      name: '',
      gender: '',
      age: undefined,
      handedness: '',
      diagnosis: '',
    };
  }

  onImageError(_event: Event): void {
    this.profileImageSrc = this.defaultProfileImage;
    this.cdr.markForCheck();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    } else {
      this.imagePreviewUrl = null;
    }
  }

  private async uploadSelectedFile(): Promise<string | null> {
    if (!this.selectedFile) return null;
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    const res = await firstValueFrom(
      this.http.post<{ url: string }>(`${LOCAL_SERVER}/upload-profile-picture`, formData)
    );
    return res.url;
  }

  editPatient(): void {
    if (this.patient) {
      this.formError = null;
      this.editForm = { ...this.patient };
      this.selectedFile = null;
      this.imagePreviewUrl = null;
      this.isEditing = true;
    }
  }

  cancelEdit(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    if (this.isCreatingProfile) {
      this.patient = null;
      this.editForm = {};
      this.formError = null;
      this.isCreatingProfile = false;
      this.isEditing = false;
      this.router.navigate(['/patient-selector']);
      return;
    }

    this.isEditing = false;
    this.editForm = {};
    this.formError = null;
  }

  async savePatient(): Promise<void> {
    if (!this.patient) return;

    const mergedPatient: Patient = { ...this.patient, ...this.editForm };

    if (!this.isPatientFormValid(mergedPatient)) {
      this.formError = 'Please fill in all patient fields before saving.';
      this.cdr.markForCheck();
      return;
    }

    this.formError = null;

    // Upload a new profile picture if the user selected one
    let uploadedImageUrl: string | null = null;
    if (this.selectedFile) {
      try {
        uploadedImageUrl = await this.uploadSelectedFile();
      } catch {
        this.formError = 'Failed to upload profile picture. Make sure the local server is running.';
        this.cdr.markForCheck();
        return;
      }
    }

    if (this.isCreatingProfile) {
      const currentUser = this.authService.getCurrentUser();

      if (!currentUser) {
        this.formError = 'User not authenticated. Please login again.';
        this.cdr.markForCheck();
        return;
      }

      const created = await this.patientService.createPatient({
        name: (mergedPatient.name ?? '').trim(),
        gender: mergedPatient.gender,
        age: Number(mergedPatient.age),
        handedness: mergedPatient.handedness,
        diagnosis: (mergedPatient.diagnosis ?? '').trim(),
        profileImage: uploadedImageUrl ?? this.patient.profileImage ?? this.defaultProfileImage,
        therapistId: currentUser.uid,
        rehabilitationGoals: (mergedPatient.rehabilitationGoals ?? '').trim(),
      });

      this.patient = created;
      this.syncProfileImageSrc();
      this.patientService.setSelectedPatient(created);
      this.isCreatingProfile = false;
      this.isEditing = false;
      this.editForm = {};
      this.cdr.markForCheck();
      return;
    }

    const updated: Patient = {
      ...mergedPatient,
      name: (mergedPatient.name ?? '').trim(),
      diagnosis: (mergedPatient.diagnosis ?? '').trim(),
      age: Number(mergedPatient.age),
      profileImage: uploadedImageUrl ?? mergedPatient.profileImage,
    };

    await this.patientService.updatePatient(updated);
    this.patient = updated;
    this.syncProfileImageSrc();
    this.patientService.setSelectedPatient(updated);
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.isEditing = false;
    this.editForm = {};
    this.cdr.markForCheck();
  }

  private isPatientFormValid(patient: Patient): boolean {
    return Boolean(
      patient.name?.trim() &&
        Number.isFinite(Number(patient.age)) &&
        Number(patient.age) >= 0 &&
        patient.gender?.trim() &&
        patient.handedness?.trim() &&
        patient.diagnosis?.trim()
    );
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
