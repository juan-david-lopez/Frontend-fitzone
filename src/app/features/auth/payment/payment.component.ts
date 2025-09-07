import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { catchError, lastValueFrom, of } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { 
  MembershipService, 
  MembershipResponse, 
  ConfirmPaymentResponse, 
  PaymentIntentRequest, 
  CreateMembershipRequest 
} from '../../../features/services/membership.service';
import { AuthService } from '../../../features/services/auth.service';
import { MembershipPlan } from '../../../core/models/membership.model';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule, MatSnackBarModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  plan: MembershipPlan | undefined;
  stripePromise: Promise<Stripe | null>;
  stripe: Stripe | null = null;
  card: StripeCardElement | null = null;
  loading: boolean = false;
  paymentProcessing: boolean = false;
  errorMessage: string = '';
  stripeElements: any = null;

  userInfo = {
    name: '',
    email: ''
  };

  private tokenRefreshInterval: any;
  cardComplete: boolean = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private membershipService: MembershipService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.stripePromise = loadStripe('pk_test_51RziwdBrYtkodFY5LauNw7awpbWvl9URO4e3cPHFEjntZl36WSH4OvGuzJZLtshxQzD50FAkOU6bd3ynC6nnqIFM00ugcaktjz');
  }

  async ngOnInit(): Promise<void> {
    console.log('Iniciando componente de pago...');

    // 1. Verificar autenticación y token
    const token = this.authService.getToken();
    const refreshToken = this.authService.getRefreshToken();
    
    if (!token || !refreshToken || !this.authService.isLoggedIn()) {
      console.log('❌ Usuario no autenticado o tokens no encontrados');
      sessionStorage.setItem('redirectUrl', '/payment');
      
      if (this.plan) {
        sessionStorage.setItem('selectedPlan', JSON.stringify(this.plan));
      }
      
      this.router.navigate(['/login'], { 
        queryParams: { 
          returnUrl: '/payment',
          message: 'Por favor inicia sesión para continuar con el pago'
        }
      });
      return;
    }

    // Configurar un intervalo para renovar el token cada 4 minutos
    this.tokenRefreshInterval = setInterval(() => {
      this.checkAndRenewToken();
    }, 240000);

    // Verificar validez del token y renovarlo si es necesario
    try {
      await this.authService.checkTokenValidity()
        .pipe(
          catchError(error => {
            console.error('❌ Error inicial al validar token:', error);

            if (this.plan) {
              sessionStorage.setItem('selectedPlan', JSON.stringify(this.plan));
            }

            if (error.status === 500) {
              console.warn('⚠️ Error del servidor al validar token, intentando continuar...');
              return of(null);
            }

            const errorMessage = error.message || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
            this.showErrorMessage(errorMessage);
            this.router.navigate(['/login'], {
              queryParams: {
                returnUrl: '/payment',
                message: errorMessage
              }
            });
            throw error;
          })
        )
        .toPromise();

        console.log('✅ Token validado/renovado correctamente');
    } catch (error: any) {
      console.error('❌ Error fatal en la validación del token:', error);
      return;
    }

    // 2. Obtener información del usuario
    console.log('🔄 Intentando obtener información del usuario...');
    let userInfo;
    
    try {
      // Primero intentar obtener del localStorage
      userInfo = this.authService.getCurrentUser();
      console.log('📋 Información del usuario desde localStorage:', userInfo);
      
      if (!userInfo?.id || !userInfo?.email) {
        console.log('🔄 Información del usuario no encontrada o incompleta, intentando obtenerla del servidor...');
        const token = this.authService.getToken();
        if (!token) {
          throw new Error('No hay token disponible');
        }

        // Intentar validar el token primero
        try {
          await this.authService.checkTokenValidity().toPromise();
          console.log('✅ Token validado correctamente');
        } catch (error) {
          console.error('❌ Error al validar token:', error);
          throw new Error('Sesión inválida. Por favor, inicia sesión nuevamente.');
        }

        // Obtener el email del usuario
        const email = this.authService.getPendingEmail() || localStorage.getItem('lastEmail');
        console.log('📧 Email a utilizar:', email);

        // Crear headers con el token renovado
        const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);

        // Intentar obtener información del usuario con reintentos
        let attempts = 0;
        const maxAttempts = 3;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        while (attempts < maxAttempts) {
          try {
            // Primero intentar con /auth/user-info
            const response: any = await this.http.get(`${this.authService['API_URL']}/auth/user-info`, { headers }).toPromise();
            if (response?.id) {
              console.log('✅ Información básica del usuario recuperada:', response);
              userInfo = response;
              break;
            }

            // Si no tiene ID, intentar con el endpoint por email
            if (email) {
              const emailResponse: any = await this.http.get(`${this.authService['API_URL']}/users/email/${email}`, { headers }).toPromise();
              if (emailResponse?.id) {
                console.log('✅ Información del usuario recuperada por email:', emailResponse);
                userInfo = emailResponse;
                break;
              }
            }

            throw new Error('Información de usuario incompleta');
          } catch (error: any) {
            attempts++;
            console.log(`⚠️ Intento ${attempts}/${maxAttempts} fallido:`, error.message);
            if (attempts < maxAttempts) {
              await delay(1000 * attempts);
              continue;
            }
            throw error;
          }
        }

        // Si se obtuvo información válida, guardarla
        if (userInfo?.id && userInfo?.email) {
          this.authService.setUserInfo({
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name || userInfo.firstName || ''
          });
        } else {
          throw new Error('No se pudo obtener información válida del usuario');
        }
      }

      // Establecer la información del usuario en el componente
      this.userInfo = {
        name: userInfo.name || userInfo.firstName || '',
        email: userInfo.email || ''
      };

    } catch (error) {
      console.error('❌ Error al obtener información del usuario:', error);
      this.showErrorMessage('Error al cargar la información del usuario');
      this.router.navigate(['/login']);
      return;
    }

    // 3. Obtener el plan seleccionado
    // Primero intentar desde el state de la navegación
    if (history.state?.selectedPlan) {
      this.plan = history.state.selectedPlan;
      console.log('Plan obtenido del state:', this.plan);
    }
    
    // Si no está en el state, intentar desde sessionStorage
    if (!this.plan) {
      const savedPlan = sessionStorage.getItem('selectedPlan');
      if (savedPlan) {
        try {
          this.plan = JSON.parse(savedPlan);
          console.log('✅ Plan recuperado del sessionStorage:', this.plan);
          sessionStorage.removeItem('selectedPlan');
        } catch (error) {
          console.error('❌ Error al parsear el plan del sessionStorage:', error);
        }
      }
    }

    // Verificar si se obtuvo el plan
    if (!this.plan?.id || !this.plan?.price || !this.plan?.name) {
      console.error('❌ Plan inválido o incompleto:', this.plan);
      this.showErrorMessage('Error al cargar el plan seleccionado');
      this.router.navigate(['/memberships']);
      return;
    }

    if (!this.plan) {
      console.log('❌ No hay plan seleccionado, redirigiendo a membresías');
      this.router.navigate(['/memberships']);
      return;
    }
  }

  async ngAfterViewInit() {
    // Inicializar Stripe después de que la vista esté completamente renderizada
    await this.initializeStripe();
  }

async initializeStripe() {
  try {
    this.stripe = await this.stripePromise;
    if (!this.stripe) {
      throw new Error('No se pudo inicializar Stripe');
    }

    // Crear elementos de Stripe
    this.stripeElements = this.stripe.elements();
    
    // Configurar el elemento de tarjeta
    this.card = this.stripeElements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          '::placeholder': {
            color: '#aab7c4'
          },
          iconColor: '#2ecc71'
        },
        invalid: {
          color: '#e74c3c',
          iconColor: '#e74c3c'
        }
      },
      hidePostalCode: false
    });

    // Verificar que this.card no sea nulo antes de usarlo
    if (this.card) {
      this.card.mount('#card-element');
      
      // Escuchar cambios en el elemento de tarjeta
      this.card.on('change', (event: any) => {
        this.errorMessage = event.error ? event.error.message : '';
        this.cardComplete = event.complete; // ← ¡FALTA ESTA LÍNEA CRÍTICA!
        
        if (event.complete) {
          console.log('✅ Formulario de tarjeta completo');
        }
      });
    } else {
      throw new Error('No se pudo crear el elemento de tarjeta de Stripe');
    }

    console.log('✅ Stripe inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Stripe:', error);
    this.showErrorMessage('Error al inicializar el sistema de pagos. Por favor, recarga la página.');
  }
}
  ngOnDestroy() {
    // Limpiar el intervalo cuando el componente se destruye
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
    
    // Destruir el elemento de Stripe si existe
    if (this.card) {
      this.card.destroy();
    }
  }

  goBack(): void {
    this.router.navigate(['/memberships']);
  }

  async pay(): Promise<void> {
  if (!this.plan || !this.stripe || !this.card) {
    this.errorMessage = 'Configuración de pago incompleta';
    return;
  }

  this.paymentProcessing = true;
  this.errorMessage = '';

  try {
    // 1. Validar token
    const token = this.authService.getToken();
    if (!token) throw new Error('La sesión ha expirado');

    try {
      await lastValueFrom(this.authService.checkTokenValidity());
    } catch (error) {
      console.error('❌ Token inválido:', error);
      this.showErrorMessage('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/payment', message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' }
      });
      return;
    }

    // 2. Validar que los campos de la tarjeta estén completos
     if (!this.cardComplete) {
    this.errorMessage = 'Por favor completa todos los campos de la tarjeta correctamente';
    return;
  }

    // 3. Obtener información del usuario
    let userInfo = this.authService.getCurrentUser();

    if (!userInfo?.id || !userInfo?.email) {
      console.log('🔄 Recuperando userInfo desde backend...');
      try {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const response: any = await lastValueFrom(
          this.http.get(`${this.authService['API_URL']}/auth/user-info`, { headers })
        );

        if (!response?.id || !response?.email) {
          throw new Error('Información de usuario incompleta');
        }

        userInfo = {
          id: response.id,
          email: response.email,
          name: response.name || response.firstName || 'Usuario'
        };

        this.authService.setUserInfo(userInfo);
      } catch (error) {
        console.error('❌ Error recuperando userInfo:', error);
        this.showErrorMessage('No se pudo obtener tu información. Por favor, inicia sesión nuevamente.');
        return;
      }
    }

    if (!userInfo) throw new Error('No se pudo obtener la información del usuario');

    // 4. Calcular monto en centavos (USD desde COP)
    const copToUsdRate = 0.00025;
    const amountInUsd = Number(this.plan.price) * copToUsdRate;
    const amountInCents = Math.max(50, Math.round(amountInUsd * 100));

    console.log('💰 Datos del pago', {
      monto_original_cop: this.plan.price,
      monto_usd: amountInUsd,
      monto_centavos: amountInCents
    });

    // 5. Crear PaymentIntent en backend
    console.log('🔄 Creando PaymentIntent...');
    const paymentIntentResponse = await lastValueFrom(
      this.membershipService.createPaymentIntent({
        amount: amountInCents,
        currency: 'usd',
        description: `Pago de membresía: ${this.plan.name}`,
        metadata: {
          plan_id: this.plan.id?.toString() || '',
          original_amount_cop: this.plan.price.toString(),
          user_email: userInfo.email
        }
      })
    );

    if (!paymentIntentResponse?.clientSecret) {
      throw new Error('No se recibió clientSecret del servidor');
    }
    console.log('✅ PaymentIntent creado:', paymentIntentResponse.clientSecret);

    // 6. Confirmar pago con Stripe
    console.log('🔄 Confirmando pago en Stripe...');
    const { error, paymentIntent } = await this.stripe.confirmCardPayment(
      paymentIntentResponse.clientSecret,
      {
         payment_method: {
      card: this.card,
      billing_details: {
        name: userInfo.name || 'Usuario',
        email: userInfo.email,
        address: {
          postal_code: '110111',  // ← MEJOR usar código postal válido para Colombia
          country: 'CO'
        }
      }
    }
      }
    );

    if (error) throw new Error(error.message);
    if (paymentIntent?.status !== 'succeeded') {
      throw new Error(`Estado inesperado: ${paymentIntent?.status}`);
    }
    console.log('✅ Pago confirmado en Stripe:', paymentIntent.id);

    // 7. Validar y convertir el ID del plan
    let planId: number;

// Si el ID es un string (como "BASIC"), necesitas mapearlo a su ID numérico
if (typeof this.plan.id === 'string') {
  // Mapear nombres de planes a sus IDs numéricos
  const planNameToId: { [key: string]: number } = {
    'BASIC': 1,
    'PREMIUM': 2,
    'VIP': 3,
    'STANDARD': 1,
    'PRO': 2,
    'ENTERPRISE': 3
    // Agrega otros mapeos según tus planes
  };
  
  planId = planNameToId[this.plan.id.toUpperCase()];
  
  if (!planId) {
    throw new Error('ID de plan de membresía inválido: ' + this.plan.id);
  }
} else {
  // Si ya es un número, usarlo directamente
  planId = Number(this.plan.id);
}

if (isNaN(planId)) {
  throw new Error('ID de plan de membresía inválido: ' + this.plan.id);
}

console.log('🔄 Creando membresía...', {
  userId: Number(userInfo.id),
  MembershipTypeId: planId, // ← Usar el ID convertido
  mainLocationId: 1,
  paymentIntentId: paymentIntent.id
});

    // 8. Crear membresía en backend
    const membershipResponse = await lastValueFrom(
      this.membershipService.createMembership({
        userId: Number(userInfo.id),
        MembershipTypeId: planId,
        mainLocationId: 1,
        paymentIntentId: paymentIntent.id
      })
    );

    if (!membershipResponse) throw new Error('Error al crear la membresía');

    if (membershipResponse.status === 'ACTIVE') {
      console.log('✅ Membresía activada:', membershipResponse);
      this.membershipService.updateCurrentMembership(membershipResponse);
      this.showSuccessMessage('¡Membresía activada exitosamente!');
      this.router.navigate(['/dashboard']);
    } else {
      throw new Error(`Membresía creada con estado inesperado: ${membershipResponse.status}`);
    }

  } catch (err: any) {
    console.error('❌ Error en el pago:', err);
    this.errorMessage = err.message || 'Ocurrió un error durante el pago';
    this.showErrorMessage(this.errorMessage);
  } finally {
    this.paymentProcessing = false;
  }
}

  private async checkAndRenewToken(): Promise<void> {
    try {
      await this.authService.checkTokenValidity().toPromise();
      console.log('✅ Token renovado automáticamente');
    } catch (error) {
      console.error('❌ Error al renovar token:', error);
      this.showErrorMessage('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      this.router.navigate(['/login'], { 
        queryParams: { 
          returnUrl: '/payment',
          message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        }
      });
    }
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
  
}