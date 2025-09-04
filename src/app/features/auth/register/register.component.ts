import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

// Enum de roles reales que acepta tu backend
export type UserRole = 'MEMBER';

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
  locations: { id: number; name: string }[] = [{ id: 1, name: 'Sede Principal' }]; 
  isSubmitting = false; // 👈 usado para deshabilitar botón
  selectedPlan: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.createForm();
    const nav = this.router.getCurrentNavigation();
    this.selectedPlan = nav?.extras.state?.['selectedPlan'];
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
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');

  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  this.isSubmitting = true;
  const payload = { ...this.registerForm.value };
  delete payload.confirmPassword;
  delete payload.acceptTerms;

  this.authService.register(payload).subscribe({
    next: (response) => {
      console.log('✅ Registro exitoso:', response);

      // 🔹 Después de registrar, redirigir dependiendo del plan
      if (this.selectedPlan) {
        this.router.navigate(['/payment'], { state: { selectedPlan: this.selectedPlan } });
      } else {
        this.router.navigate(['/login']);
      }
    },
    error: (err) => {
      console.error('❌ Error en registro:', err);
      this.isSubmitting = false;
      alert('Error al registrar usuario');
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
