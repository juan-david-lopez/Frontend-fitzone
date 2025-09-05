import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  plan: { id: number; name: string; price: number } | undefined;
  stripePromise: Promise<Stripe | null> = loadStripe('pk_test_51S3qmhPqGEqzsrh3v5o9RzJkyBCEuqEs46RxZ87cXS0M74VsN85PAHmV9Rijl2BC9xTbE7tsC4zGtKFtNilKkr2N008xHTPNdd');

  constructor(private router: Router, private http: HttpClient) {
    const nav = this.router.getCurrentNavigation();
    this.plan = nav?.extras.state?.['selectedPlan'];
  }

  ngOnInit(): void {
    if (!this.plan) {
      this.router.navigate(['/memberships']);
    }
  }

  goBack(): void {
    this.router.navigate(['/memberships']);
  }

  async pay(): Promise<void> {
  if (!this.plan) {
    alert('No se ha seleccionado un plan.');
    this.router.navigate(['/memberships']);
    return;
  }

  try {
    // Convertimos el precio a centavos para Stripe
    const amountInCents = Math.round(this.plan.price * 100);

    // 1️⃣ Crear PaymentIntent en el backend
    const clientSecretResponse = await this.http
      .post<{ clientSecret: string }>('http://localhost:8080/memberships/create-payment-intent', {
        amount: amountInCents,
        currency: 'usd',
        description: `Pago de membresía: ${this.plan.name}`
      })
      .toPromise();

    if (!clientSecretResponse?.clientSecret) {
      throw new Error('No se recibió el client secret del backend.');
    }

    const stripe = await this.stripePromise;
    if (!stripe) {
      throw new Error('Error al inicializar Stripe.');
    }

    // 2️⃣ Confirmar pago con tarjeta de prueba
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecretResponse.clientSecret,
      {
        payment_method: {
          card: { token: 'tok_visa' }, // Para pruebas
          billing_details: { name: 'Usuario Prueba' }
        }
      }
    );

    if (error) {
      console.error('Error en pago:', error.message);
      alert('❌ Pago fallido: ' + error.message);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      console.log('✅ Pago exitoso', paymentIntent);

      // 3️⃣ Activar membresía en backend
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('Usuario no identificado.');

      await this.http
        .patch(
          `http://localhost:8080/memberships/activate/${userId}`,
          {
            membershipTypeId: this.plan.id,
            mainLocationId: 1,
            paymentIntentId: paymentIntent.id
          }
        )
        .toPromise();

      alert('🎉 Membresía activada');
      this.router.navigate(['/dashboard']);
    }
  } catch (err: any) {
    console.error('Error en el proceso de pago:', err);
    alert('❌ Ocurrió un error: ' + err.message);
  }
}
}
