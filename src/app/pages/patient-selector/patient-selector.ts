import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { PatientCard } from '../../cards/patient-card/patient-card';
import { PatientService, Patient } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-selector',
  imports: [PatientCard],
  templateUrl: './patient-selector.html',
  styleUrl: './patient-selector.css',
})
export class PatientSelector implements OnInit {
  patients: Patient[] = [];
  searchTerm = '';
  isLoading = true;
  error: string | null = null;
  isExportMode = false;
  isDeleteMode = false;
  selectedPatients: Set<string> = new Set();

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  get filteredPatients(): Patient[] {
    const term = this.normalizeText(this.searchTerm);

    if (!term) {
      return this.patients;
    }

    return this.patients.filter((patient) =>
      this.normalizeText(patient.name).includes(term)
    );
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  addPatient(): void {
    this.router.navigate(['/patient-profile'], { state: { createNew: true } });
  }

  toggleExportMode(): void {
    this.isExportMode = !this.isExportMode;
    if (!this.isExportMode) {
      this.selectedPatients.clear();
    }
  }

  toggleDeleteMode(): void {
    this.isDeleteMode = !this.isDeleteMode;
    if (!this.isDeleteMode) {
      this.selectedPatients.clear();
    }
  }

  togglePatientSelection(patientId: string): void {
    if (this.selectedPatients.has(patientId)) {
      this.selectedPatients.delete(patientId);
    } else {
      this.selectedPatients.add(patientId);
    }
  }

  exportSelected(): void {
    if (this.selectedPatients.size === 0) {
      alert('Please select at least one patient to export.');
      return;
    }

    const selectedData = this.patients
      .filter(p => this.selectedPatients.has(p.id))
      .map(p => {
        // Exclude profileImage as it's server-specific and not portable
        const { profileImage, id, therapistId, ...exportData } = p;
        return exportData;
      });
    const json = JSON.stringify(selectedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patients_export.json';
    a.click();
    URL.revokeObjectURL(url);
    this.isExportMode = false;
    this.selectedPatients.clear();
  }

  deleteSelected(): void {
    if (this.selectedPatients.size === 0) {
      alert('Please select at least one patient to delete.');
      return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete ${this.selectedPatients.size} patient(s)? This action cannot be undone.`);
    if (!confirmDelete) {
      return;
    }

    this.ngZone.run(async () => {
      try {
        for (const patientId of this.selectedPatients) {
          await this.patientService.deletePatient(patientId);
        }
        await this.loadPatients();
        alert('Selected patients deleted successfully.');
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete patients: ' + (error as Error).message);
      } finally {
        this.isDeleteMode = false;
        this.selectedPatients.clear();
      }
    });
  }

  importPatients(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!Array.isArray(json)) {
          throw new Error('JSON must be an array of patients.');
        }

        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
          throw new Error('User not authenticated.');
        }

        for (const patientData of json) {
          if (!this.isValidPatientData(patientData)) {
            throw new Error('Invalid patient data structure.');
          }

          const newPatient: Omit<Patient, 'id'> = {
            name: patientData.name,
            gender: patientData.gender,
            age: patientData.age,
            handedness: patientData.handedness,
            diagnosis: patientData.diagnosis,
            profileImage: '/imgs/profile.jpg', // Set default image for imported patients
            therapistId: currentUser.uid,
            rehabilitationGoals: patientData.rehabilitationGoals,
          };

          await this.patientService.createPatient(newPatient);
        }

        // Reload patients
        await this.loadPatients();
        alert('Patients imported successfully. You can update profile images manually in the patient profiles.');
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import patients: ' + (error as Error).message);
      }
    };
    reader.readAsText(file);
    input.value = ''; // Reset input
  }

  private isValidPatientData(data: any): boolean {
    return (
      typeof data.name === 'string' &&
      typeof data.gender === 'string' &&
      typeof data.age === 'number' &&
      typeof data.handedness === 'string' &&
      typeof data.diagnosis === 'string' &&
      (data.rehabilitationGoals === undefined || typeof data.rehabilitationGoals === 'string')
    );
  }

  private normalizeText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private async loadPatients(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.ngZone.run(async () => {
      try {
        this.isLoading = true;
        this.patients = await this.patientService.getAllPatients(currentUser.uid);
        
        if (this.patients.length === 0) {
          this.error = 'No patients found. Please add a patient first.';
        }
        
        this.cdr.markForCheck();
      } catch (error) {
        console.error('Error loading patients:', error);
        this.error = 'Failed to load patients. Please try again.';
        this.cdr.markForCheck();
      } finally {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
