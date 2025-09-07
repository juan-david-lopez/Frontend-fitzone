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

    this.isSubmitting = true;
    this.errorMsg = '';
    this.infoMsg = '';

    const otp = this.otpForm.get('otp')?.value;

    console.log('🔄 Validando OTP para:', this.email);
    this.authService.validateOTP(this.email, otp).subscribe({
      next: (response) => {
        console.log('✅ Respuesta de validación OTP:', response);
        this.isSubmitting = false;

        if (response && response.accessToken) {
          console.log('🔑 Token recibido, estableciendo sesión...');
          // La sesión ya se establece en el AuthService
          
          // Recuperar el plan seleccionado de varias fuentes posibles
          const selectedPlan = history.state?.['selectedPlan'] || 
                            sessionStorage.getItem('selectedPlan');
          
          if (selectedPlan) {
            console.log('🎯 Plan seleccionado encontrado, redirigiendo a pagos');
            // Si es string (de sessionStorage) parsearlo
            const plan = typeof selectedPlan === 'string' ? JSON.parse(selectedPlan) : selectedPlan;
            this.router.navigate(['/payment'], { state: { selectedPlan: plan } });
            // Limpiar el plan del sessionStorage
            sessionStorage.removeItem('selectedPlan');
          } else {
            console.log('➡️ Redirigiendo al dashboard');
            this.router.navigate(['/dashboard']);
          }
        } else {
          console.error('❌ Respuesta del servidor sin token:', response);
          this.errorMsg = 'Error en la respuesta del servidor';
        }
      },
      error: (error) => {
        console.error('❌ Error en validación OTP:', error);
        this.isSubmitting = false;
        
        if (error.status === 401) {
          this.errorMsg = 'Código incorrecto o expirado';
        } else if (error.status === 429) {
          this.errorMsg = 'Demasiados intentos. Por favor, espera unos minutos.';
        } else {
          this.errorMsg = error.error?.message || 'Error al verificar el código';
        }
      }
    });
}



  resendOTP() {
    if (!this.email || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMsg = '';
    this.infoMsg = '';

    this.authService.generateOTP(this.email).subscribe({
      next: (response) => {
        console.log('✅ OTP reenviado exitosamente:', response);
        this.isSubmitting = false;
        this.infoMsg = 'Se ha enviado un nuevo código a tu correo';
        // Reiniciar el formulario
        this.otpForm.reset();
      },
      error: (error) => {
        console.error('❌ Error al reenviar OTP:', error);
        this.isSubmitting = false;
        if (error.status === 429) {
          this.errorMsg = 'Demasiados intentos. Por favor, espera unos minutos.';
        } else {
          this.errorMsg = error.error?.message || 'No se pudo enviar el código. Intenta nuevamente.';
        }
      }
    });
  }
}