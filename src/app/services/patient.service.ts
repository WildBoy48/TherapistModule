import { Injectable, NgZone } from '@angular/core';
import { Firestore, collection, getDocs, query, where, doc, updateDoc, setDoc, deleteDoc } from '@angular/fire/firestore';

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

export interface PatientConfig {
  audioCues: boolean;
  backgroundDetail: number;
  bci_minGripTime: number;
  device: string;
  hapticFeedback: boolean;
  seat: number;
  sessionDuration: number;
  targetScore: number;
  visualCues: boolean;
}

export interface PatientConfigDocument extends PatientConfig {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private patientsCollection = 'patients';
  private patientConfigsCollection = 'patient_configs';
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

  /**
   * Update a patient's data in the database
   */
  async updatePatient(patient: Patient): Promise<void> {
    const patientRef = doc(this.firestore, this.patientsCollection, patient.id);
    const { id, ...updateData } = patient;
    await updateDoc(patientRef, updateData as { [key: string]: unknown });
  }

  /**
   * Create a new patient profile in the database
   */
  async createPatient(patientData: Omit<Patient, 'id'>): Promise<Patient> {
    const patientRef = doc(collection(this.firestore, this.patientsCollection));
    const newPatient: Patient = {
      id: patientRef.id,
      ...patientData,
    };

    await setDoc(patientRef, newPatient);
    return newPatient;
  }

  /**
   * Delete a patient from the database
   */
  async deletePatient(patientId: string): Promise<void> {
    const patientRef = doc(this.firestore, this.patientsCollection, patientId);
    await deleteDoc(patientRef);
  }

  async getPatientConfig(patientId: string, miniGameId: number): Promise<PatientConfigDocument | null> {
    const patientConfigRef = collection(this.firestore, this.patientConfigsCollection);
    const configQuery = query(
      patientConfigRef,
      where('patientID', '==', patientId),
      where('miniGameID', '==', miniGameId)
    );

    const querySnapshot = await getDocs(configQuery);
    if (querySnapshot.empty) {
      return null;
    }

    // Assume only one config document exists per patient / mini-game combination.
    const docSnapshot = querySnapshot.docs[0];
    const configData = docSnapshot.data() as PatientConfig;
    return { id: docSnapshot.id, ...configData };
  }

  async createPatientConfig(patientId: string, miniGameId: number, config: PatientConfig): Promise<string> {
    const configRef = doc(collection(this.firestore, this.patientConfigsCollection));
    const configWithRefs = {
      patientID: patientId,
      miniGameID: miniGameId,
      ...config,
    };

    await setDoc(configRef, configWithRefs as { [key: string]: unknown });
    return configRef.id;
  }

  async updatePatientConfig(configId: string, config: PatientConfig): Promise<void> {
    const configRef = doc(this.firestore, this.patientConfigsCollection, configId);
    await updateDoc(configRef, { ...config });
  }
}
