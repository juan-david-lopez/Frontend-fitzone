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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.createForm();
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
      console.log('✅ Login successful:', response);

      // 👉 Guardar token que devuelve el backend
      this.saveToken(response.accessToken);

      // Guardar email si rememberMe está activo
      if (this.loginForm.get('rememberMe')?.value) {
        this.saveCredentials(loginRequest.email);
      } else {
        this.clearSavedCredentials();
      }

      this.isSubmitting = false;

      // 👉 Redirigir al dashboard
      this.router.navigate(['/dashboard'], {
        state: { userEmail: loginRequest.email }
      });
    },
    error: (error) => {
      console.error('❌ Login failed:', error);
      this.isSubmitting = false;
      
      if (error.status === 401) {
        this.loginError = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      } else if (error.status === 0) {
        this.loginError = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else {
        this.loginError = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
      }
    }
  });
}

  private saveToken(token: string): void {
  try {
    localStorage.setItem('authToken', token);
  } catch (error) {
    console.warn('No se pudo guardar el token', error);
  }
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
        next: () => console.log('📩 Password reset email sent'),
        error: (err) => console.error('Reset failed', err)
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
