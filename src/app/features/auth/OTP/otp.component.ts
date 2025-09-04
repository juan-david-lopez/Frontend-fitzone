import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; // ✅ Agregar ActivatedRoute
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss']
})
export class OTPComponent {
  otpForm: FormGroup;
  email!: string;
  errorMsg = '';
  infoMsg = '';
  isSubmitting = false; // ✅ Agregar esta propiedad

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute, // ✅ Agregar ActivatedRoute
    private authService: AuthService
  ) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit(): void {
  const navState = this.router.getCurrentNavigation()?.extras.state;
  console.log('📧 Estado de navegación:', navState);
  
  this.route.queryParams.subscribe(params => {
    console.log('📧 Query params:', params);
    
    this.email = navState?.['email'] || params['email'];
    console.log('📧 Email recibido:', this.email);
    
    if (!this.email) {
      console.log('❌ No se recibió email, redirigiendo a login');
      this.router.navigate(['/login']);
    }
  });
}

  submitOTP() {
    if (!this.otpForm.valid || this.isSubmitting) return;

    this.isSubmitting = true; // ✅ Iniciar loading
    this.errorMsg = '';
    this.infoMsg = '';

    const otp = this.otpForm.get('otp')?.value;
    
    this.authService.validateOTP(this.email, otp).subscribe({
      next: (response) => {
        this.isSubmitting = false; // ✅ Finalizar loading
        
        if (response && response.accessToken) {
          this.authService.setSession({ accessToken: response.accessToken });
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMsg = 'Error en la respuesta del servidor';
        }
      },
      error: (error) => {
        this.isSubmitting = false; // ✅ Finalizar loading
        this.errorMsg = error.error?.error || 'Código incorrecto o expirado';
      }
    });
  }

  resendOTP() {
    if (!this.email || this.isSubmitting) return;

    this.isSubmitting = true; // ✅ Iniciar loading
    this.errorMsg = '';
    this.infoMsg = '';

    this.authService.generateOTP(this.email).subscribe({
      next: () => {
        this.isSubmitting = false; // ✅ Finalizar loading
        this.infoMsg = 'Se ha enviado un nuevo código a tu correo';
      },
      error: (error) => {
        this.isSubmitting = false; // ✅ Finalizar loading
        this.errorMsg = error.error?.error || 'No se pudo enviar el código. Intenta nuevamente.';
      }
    });
  }
}