import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-patient-card',
  imports: [RouterLink],
  templateUrl: './patient-card.html',
  styleUrl: './patient-card.css',
})
export class PatientCard {}
