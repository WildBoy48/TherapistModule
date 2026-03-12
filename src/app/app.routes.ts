import { Routes } from '@angular/router';
import { SessionConfig } from './pages/session-config/session-config';
import { MiniGameSelector } from './pages/mini-game-selector/mini-game-selector';
import { PatientSelector } from './pages/patient-selector/patient-selector';
import { PatientProfile } from './pages/patient-profile/patient-profile';
import { TherapySession } from './pages/therapy-session/therapy-session';
import { NotFound } from './pages/not-found/not-found';
import { Login } from './pages/login/login';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    {  // Default route redirects to session-config
        path: '',
        redirectTo: 'session-config',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login,
    },
    {
        path: 'session-config',
        component: SessionConfig,
        canActivate: [AuthGuard],
    },
    {
        path: 'mini-game-selector',
        component: MiniGameSelector,
        canActivate: [AuthGuard],
    },
    {
        path: 'patient-selector',
        component: PatientSelector,
        canActivate: [AuthGuard],
    },
    {
        path: 'patient-profile',
        component: PatientProfile,
        canActivate: [AuthGuard],
    },
    {
        path: 'therapy-session',
        component: TherapySession,
        canActivate: [AuthGuard],
    },
    {
        path: '**',
        component: NotFound,
    }
];
