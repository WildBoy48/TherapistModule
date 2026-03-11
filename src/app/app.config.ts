import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'therapist-module',
        appId: '1:931936192365:web:cc0d6255d7673b33ff7c64',
        storageBucket: 'therapist-module.firebasestorage.app',
        apiKey: 'AIzaSyApqMhm8L_nZUWSNNsFc8cGIbFufk-wdvI',
        authDomain: 'therapist-module.firebaseapp.com',
        messagingSenderId: '931936192365',
        projectNumber: '931936192365',
        version: '2',
      }),
    ),
    provideFirestore(() => getFirestore()),
  ],
};
