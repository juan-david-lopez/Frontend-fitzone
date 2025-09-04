import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent {
  plan: any;

  constructor(private router: Router, private http: HttpClient) {
    const nav = this.router.getCurrentNavigation();
    this.plan = nav?.extras.state?.['selectedPlan'];
  }

  pay() {
    this.http.post('http://localhost:8080/memberships/create-payment-intent', {
      amount: this.plan.price,
      currency: 'usd',
      description: `Pago de membresía: ${this.plan.name}`
    }).subscribe((clientSecret: any) => {
      console.log('Stripe client secret:', clientSecret);
      // como hago esto // Aquí integras Stripe.js para confirmar el pago en frontend
    });
  }
}
