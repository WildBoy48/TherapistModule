import { Routes } from '@angular/router';
import { SessionConfig } from './pages/session-config/session-config';
import { MiniGameSelector } from './pages/mini-game-selector/mini-game-selector';
import { PatientSelector } from './pages/patient-selector/patient-selector';
import { PatientProfile } from './pages/patient-profile/patient-profile';
import { TherapySession } from './pages/therapy-session/therapy-session';
import { NotFound } from './pages/not-found/not-found';

export const routes: Routes = [
    {  // Default route redirects to session-config
        path: '',
        redirectTo: 'session-config',
        pathMatch: 'full'
    },
    {
        path: 'session-config',
        component: SessionConfig,
    },
    {
        path: 'mini-game-selector',
        component: MiniGameSelector,
    },
    {
        path: 'patient-selector',
        component: PatientSelector,
    },
    {
        path: 'patient-profile',
        component: PatientProfile,
    },
    {
        path: 'therapy-session',
        component: TherapySession
    },
    {
        path: '**',
        component: NotFound,
    }
];
