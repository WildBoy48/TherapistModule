import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isRegistering = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Create form with disabled controls
    this.loginForm = this.fb.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  ngOnInit(): void {
    // No additional initialization needed
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle login form submission
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.setFormDisabled(true);
    this.errorMessage = '';

    try {
      const { email, password } = this.loginForm.value;
      
      if (this.isRegistering) {
        await this.authService.register(email, password);
        this.isRegistering = false;
        this.loginForm.reset();
        this.errorMessage = 'Registration successful! Please log in.';
        this.setFormDisabled(false);
      } else {
        await this.authService.login(email, password);
        this.router.navigate(['/session-config']);
      }
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error.code);
      this.setFormDisabled(false);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Toggle between login and registration
   */
  toggleMode(): void {
    if (this.isLoading) return;
    this.isRegistering = !this.isRegistering;
    this.loginForm.reset();
    this.errorMessage = '';
  }

  /**
   * Enable/disable all form controls
   */
  private setFormDisabled(disabled: boolean): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      if (disabled) {
        control?.disable();
      } else {
        control?.enable();
      }
    });
  }

  /**
   * Get user-friendly error messages
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'User account is disabled',
      'auth/user-not-found': 'User not found',
      'auth/wrong-password': 'Wrong password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password is too weak',
      'auth/operation-not-allowed': 'Operation not allowed',
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }

  /**
   * Get form control for template
   */
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
