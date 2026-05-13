import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Subscription, interval, of } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { PatientService } from '../../services/patient.service';
import { GameStatsService } from '../../services/game-stats.service';
import { FormsModule } from '@angular/forms';
import { ServerConfigService } from '../../services/server-config.service';


interface ServerStatusResponse {
  server: boolean;
  unityConnected: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  serverStatus: 'unknown' | 'online' | 'offline' = 'unknown';
  unityStatus: 'unknown' | 'connected' | 'disconnected' = 'unknown';
  private statusSubscription: Subscription | null = null;
  private unitySubscription: Subscription | null = null;
  serverIp: string = '';
  
  constructor(
    private authService: AuthService,
    private patientService: PatientService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private gameStats: GameStatsService,
    private serverConfig: ServerConfigService
  ) {}

  ngOnInit(): void {
    this.serverIp = this.serverConfig.getServerIp();
    this.statusSubscription = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.http.get<ServerStatusResponse>(`${this.serverConfig.getBaseUrl()}/status`).pipe(
            catchError(() => {
              this.serverStatus = 'offline';
              this.unityStatus = 'disconnected';
              return of({ server: false, unityConnected: false });
            })
          )
        )
      )
      .subscribe((status) => {
        if (status && typeof status === 'object') {
          this.serverStatus = status.server ? 'online' : 'offline';
          this.unityStatus = status.unityConnected ? 'connected' : 'disconnected';
          this.cdr.markForCheck();
        }
      });

    this.unitySubscription = this.gameStats.connected$.subscribe((connected) => {
      this.unityStatus = connected ? 'connected' : 'disconnected';
      if (connected) {
        this.serverStatus = 'online';
      }
      this.cdr.markForCheck();
    });

    this.gameStats.connect();
  }

  ngOnDestroy(): void {
    this.statusSubscription?.unsubscribe();
    this.unitySubscription?.unsubscribe();
  }

  get isPatientSelected(): boolean {
    return this.patientService.getSelectedPatient() !== null;
  }

  get serverStatusLabel(): string {
    switch (this.serverStatus) {
      case 'online':
        return 'Local server online';
      case 'offline':
        return 'Local server offline';
      default:
        return 'Checking server...';
    }
  }

  get unityStatusLabel(): string {
    switch (this.unityStatus) {
      case 'connected':
        return 'Unity game connected';
      case 'disconnected':
        return 'Unity game disconnected';
      default:
        return 'Checking Unity...';
    }
  }

  get serverStatusClass(): string {
    return `status-dot ${this.serverStatus}`;
  }

  get unityStatusClass(): string {
    return `status-dot ${this.unityStatus === 'connected' ? 'online' : this.unityStatus === 'disconnected' ? 'offline' : 'unknown'}`;
  }

  /**
   * Handle logout
   */
  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  updateIp(): void {

  const ipRegex =
    /^(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)$/;

  if (!ipRegex.test(this.serverIp)) {
    alert('Invalid IP address');
    return;
  }
  this.serverConfig.setServerIp(this.serverIp);
  this.gameStats.connect();
}
}
