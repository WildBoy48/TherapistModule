import { Injectable, NgZone } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';

export interface Patient {
  id: string;
  name: string;
  gender: string;
  age: number;
  handedness: string;
  diagnosis: string;
  profileImage: string;
  therapistId: string;
  rehabilitationGoals?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private patientsCollection = 'patients';
  private selectedPatient: Patient | null = null;

  constructor(private firestore: Firestore, private ngZone: NgZone) {}

  /**
   * Fetch all patients for a specific therapist from the database
   */
  async getAllPatients(therapistId: string): Promise<Patient[]> {
    try {
      console.log(`Fetching patients for therapist: ${therapistId}`);
      const patientsRef = collection(this.firestore, this.patientsCollection);
      const q = query(patientsRef, where('therapistId', '==', therapistId));
      const querySnapshot = await getDocs(q);
      
      console.log(`Found ${querySnapshot.size} patients`);
      
      const patients: Patient[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Patient;
        console.log('Patient data:', data);
        patients.push(data);
      });

      // Sort by name for consistent ordering
      patients.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log('Patients loaded:', patients);
      return patients;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  /**
   * Set the selected patient
   */
  setSelectedPatient(patient: Patient | null): void {
    this.selectedPatient = patient;
  }

  /**
   * Get the currently selected patient
   */
  getSelectedPatient(): Patient | null {
    return this.selectedPatient;
  }
}
