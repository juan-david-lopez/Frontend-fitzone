// payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { loadStripe } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private stripePromise = loadStripe('pk_test_51RziwdBrYtkodFY5LauNw7awpbWvl9URO4e3cPHFEjntZl36WSH4OvGuzJZLtshxQzD50FAkOU6bd3ynC6nnqIFM00ugcaktjzv'); 
  constructor(private http: HttpClient) {}

  createPaymentIntent(amount: number, currency: string, description: string) {
    return this.http.post<string>('http://localhost:8080/memberships/create-payment-intent', {
      amount, currency, description
    });
  }

  async pay(amount: number, currency: string, description: string) {
    const stripe = await this.stripePromise;
    const clientSecret = await this.createPaymentIntent(amount, currency, description).toPromise();

    if (!stripe) throw new Error('Stripe no cargó');

    const result = await stripe.confirmCardPayment(clientSecret!, {
      payment_method: {
        card: { token: 'tok_visa' }, // 👈 en producción usar Stripe Elements
      }
    });

    return result;
  }
}
