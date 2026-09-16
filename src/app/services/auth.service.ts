import { Injectable, NgZone } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, User, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { UserService } from './user.service';
import { PatientService } from './patient.service';
import { MiniGameService } from './mini-game.service';
import { GameStatsService } from './game-stats.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser$: Observable<User | null>;
  private currentUser: User | null = null;

  constructor(
    private auth: Auth,
    private userService: UserService,
    private patientService: PatientService,
    private miniGameService: MiniGameService,
    private gameStats: GameStatsService,
    private ngZone: NgZone
  ) {
    // Use AngularFire's authState observable which handles zone management
    this.currentUser$ = authState(this.auth);
    
    // Subscribe to auth state changes to track current user and update last login
    this.currentUser$.subscribe((user) => {
      this.ngZone.run(() => {
        this.currentUser = user;

        if (!user) {
          this.patientService.clearSelectedPatient();
          this.miniGameService.clearSelectedMiniGame();
          this.gameStats.disconnect();
        }
        
        // Update last login when user logs in
        if (user) {
          this.userService.updateLastLogin(user.uid).catch((error) => {
            console.error('Error updating last login:', error);
          });
        }
      });
    });
  }

  /**
   * Get current user synchronously
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    return this.ngZone.run(async () => {
      try {
        const result = await signInWithEmailAndPassword(this.auth, email, password);
        // Ensure user profile exists and update last login
        const userExists = await this.userService.userExists(result.user.uid);
        if (!userExists) {
          await this.userService.createUserProfile(result.user);
        } else {
          await this.userService.updateLastLogin(result.user.uid);
        }
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    });
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<void> {
    return this.ngZone.run(async () => {
      try {
        const result = await createUserWithEmailAndPassword(this.auth, email, password);
        // Create user profile in Firestore
        await this.userService.createUserProfile(result.user);
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    });
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    return this.ngZone.run(async () => {
      try {
        await signOut(this.auth);
      } catch (error) {
        console.error('Logout failed:', error);
        throw error;
      }
    });
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}
