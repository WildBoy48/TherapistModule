import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { PatientCard } from '../../cards/patient-card/patient-card';
import { PatientService, Patient } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-patient-selector',
  imports: [PatientCard],
  templateUrl: './patient-selector.html',
  styleUrl: './patient-selector.css',
})
export class PatientSelector implements OnInit {
  patients: Patient[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  private loadPatients(): void {
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
