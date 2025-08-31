import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

// Enum de roles reales que acepta tu backend
export type UserRole = 'MEMBER' | 'INSTRUCTOR';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  roles: UserRole[] = ['MEMBER']; // fijo
  documentTypes: string[] = ['CC', 'TI', 'CE']; // 👈 para que no falle el HTML
  locations: { id: number; name: string }[] = [{ id: 1, name: 'Sede Principal' }]; // 👈 fijo a 1
  isSubmitting = false; // 👈 usado para deshabilitar botón

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        documentType: ['', [Validators.required]],
        documentNumber: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        phoneNumber: ['', [Validators.required]],
        birthDate: ['', [Validators.required]],
        emergencyContactPhone: ['', [Validators.required]],
        medicalConditions: [''],
        mainLocationId: [1, [Validators.required]], // fijo en 1
        role: ['MEMBER', [Validators.required]],
        acceptTerms: [false, [Validators.requiredTrue]]
      },
      { validators: passwordMatchValidator }
    );
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = { ...this.registerForm.value };
    delete payload.confirmPassword;
    delete payload.acceptTerms;

    this.authService.register(payload).subscribe({
      next: () => {
        alert('Usuario registrado con éxito');
        this.navigateToLogin();
      },
      error: (err) => {
        console.error('Error en registro:', err);
        alert('Error al registrar usuario');
        this.isSubmitting = false;
      }
    });
  }

  // 👈 función que pedía tu template
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}

// 🔐 Validador de contraseñas
export function passwordMatchValidator(group: FormGroup) {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { mismatch: true };
}
