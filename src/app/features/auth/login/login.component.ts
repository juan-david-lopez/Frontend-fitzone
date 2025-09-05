import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  ReactiveFormsModule, 
  AbstractControl,
  ValidationErrors,
  ValidatorFn 
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitting = false;
  loginError: string = '';
  selectedPlan: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.createForm();
    const nav = this.router.getCurrentNavigation();
  this.selectedPlan = nav?.extras.state?.['selectedPlan'];
  }

  ngOnInit(): void {
    this.loadSavedCredentials();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        this.emailValidator()
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      rememberMe: [false]
    });
  }

  private emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailPattern.test(control.value.trim()) ? null : { invalidEmail: true };
    };
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.loginForm.get(fieldName);
    if (!field) return false;
    return errorType 
      ? field.hasError(errorType) && (field.dirty || field.touched) 
      : field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    if (fieldName === 'email') {
      if (errors['required']) return 'El correo electrónico es requerido';
      if (errors['email'] || errors['invalidEmail']) return 'Por favor ingresa un correo válido';
    }
    if (fieldName === 'password') {
      if (errors['required']) return 'La contraseña es requerida';
      if (errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres';
    }
    return 'Campo inválido';
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (!this.loginForm.valid) return;

    this.isSubmitting = true;
    this.loginError = '';
    
    const loginRequest: LoginRequest = {
      email: this.loginForm.get('email')?.value.trim(),
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('✅ Login successful, OTP required:', response);
        const nav = this.router.getCurrentNavigation();
        const selectedPlan = nav?.extras.state?.['selectedPlan'];

        if (selectedPlan) {
          this.router.navigate(['/payment'], { state: { selectedPlan } });
        } else {
         this.router.navigate(['/dashboard']);
        }
        // Guardar email si rememberMe está activo
        if (this.loginForm.get('rememberMe')?.value) {
          this.saveCredentials(loginRequest.email);
        } else {
          this.clearSavedCredentials();
        }

        this.isSubmitting = false;

        // ✅ CORREGIDO: Verificar que la respuesta indica que se requiere OTP
        if (response && (response.status === 'OTP_REQUIRED' || response.step === 1)) {
          // 🔹 Redirigir a OTP con el email
          this.router.navigate(['/otp'], { 
            state: { email: loginRequest.email },
            queryParams: { email: loginRequest.email }
          });
        } else {
          // 🔹 Si no requiere OTP, verificar si hay token directo
          if (response.accessToken) {
            this.authService.setSession(response);
            this.router.navigate(['/dashboard']);
          } else {
            this.loginError = 'Respuesta inesperada del servidor';
          }
        }
      },
      error: (error) => {
        console.error('❌ Login failed:', error);
        this.isSubmitting = false;
        
        // ✅ MEJORADO: Manejo de errores específico para tu backend
        if (error.status === 401) {
          this.loginError = error.error?.error || 
                           error.error?.message || 
                           'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else if (error.status === 403) {
          this.loginError = error.error?.error || 
                           error.error?.message || 
                           'Acceso denegado. Contacta al administrador.';
        } else if (error.status === 0 || error.status === 500) {
          this.loginError = 'Error de conexión con el servidor. Intenta nuevamente.';
        } else {
          // Extraer mensaje de error del backend
          const errorMessage = error.error?.error || 
                              error.error?.message || 
                              error.message ||
                              'Ocurrió un error inesperado. Inténtalo de nuevo.';
          this.loginError = errorMessage;
        }
      }
    });
  }
  goHome(): void {
  this.router.navigate(['/home']).catch(console.error);
}

  private saveCredentials(email: string): void {
    try {
      localStorage.setItem('rememberedEmail', email);
    } catch (error) {
      console.warn('No se pudo guardar el email', error);
    }
  }

  private loadSavedCredentials(): void {
    try {
      const email = localStorage.getItem('rememberedEmail');
      if (email) {
        this.loginForm.patchValue({ email, rememberMe: true });
      }
    } catch {}
  }

  private clearSavedCredentials(): void {
    try { localStorage.removeItem('rememberedEmail'); } catch {}
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']).catch(console.error);
  }

  forgotPassword(): void {
    const email = this.loginForm.get('email')?.value;
    if (email && this.loginForm.get('email')?.valid) {
      this.authService.forgotPassword(email).subscribe({
        next: () => {
          this.loginError = '📩 Se han enviado instrucciones a tu correo';
        },
        error: (error) => {
          this.loginError = error.error?.error || 
                           error.error?.message || 
                           'Error al enviar instrucciones de recuperación';
        }
      });
    }
  }

  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'example@gmail.com',
      password: '123456'
    });
  }
}