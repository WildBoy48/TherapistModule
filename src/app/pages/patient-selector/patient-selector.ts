import { Component } from '@angular/core';
import { PatientCard } from '../../cards/patient-card/patient-card';

@Component({
  selector: 'app-patient-selector',
  imports: [PatientCard],
  templateUrl: './patient-selector.html',
  styleUrl: './patient-selector.css',
})
export class PatientSelector {}
