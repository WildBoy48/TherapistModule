import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Sidebar } from './pages/sidebar/sidebar';
import { AuthService } from './services/auth.service';
import { signal, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('TherapistModule');
  private destroy$ = new Subject<void>();
  
  // Track if user is logged in
  isLoggedIn = signal(false);
  // Track current route
  currentRoute = signal('');
  
  // Check if sidebar should be visible
  shouldShowSidebar: Signal<boolean> = computed(() => 
    this.isLoggedIn() &&
    this.currentRoute() !== '/login' &&
    this.currentRoute() !== '/therapy-session'
  );

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication changes and update signal
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.isLoggedIn.set(user !== null);
      });

    // Subscribe to route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.currentRoute.set(event.urlAfterRedirects || event.url);
      });

    // Set initial route
    this.currentRoute.set(this.router.url);
    
    // Set initial auth state
    this.isLoggedIn.set(this.authService.isAuthenticated());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

