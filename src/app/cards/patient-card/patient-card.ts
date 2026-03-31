import { Component, Input, OnChanges, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Patient } from '../../services/patient.service';
import { PatientService } from '../../services/patient.service';

const DEFAULT_PROFILE_IMAGE = '/imgs/profile.jpg';

@Component({
  selector: 'app-patient-card',
  imports: [],
  templateUrl: './patient-card.html',
  styleUrl: './patient-card.css',
})
export class PatientCard implements OnChanges {
  @Input() patient!: Patient;
  @Input() isSelectable: boolean = false; // true when in patient-selector, false when in session-config

  imgSrc: string = DEFAULT_PROFILE_IMAGE;

  constructor(
    private patientService: PatientService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(): void {
    this.imgSrc = this.patient?.profileImage || DEFAULT_PROFILE_IMAGE;
  }

  onImageError(): void {
    this.imgSrc = DEFAULT_PROFILE_IMAGE;
    this.cdr.markForCheck();
  }

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
    this.router.navigate(['/patient-profile'], { state: { patient: this.patient } });
  }
}
