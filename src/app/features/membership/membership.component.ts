import { Component, OnInit } from '@angular/core';
import { PaymentService } from './payment.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-membership',
  templateUrl: './membership.component.html',
  imports: [CommonModule, FormsModule, CurrencyPipe],
  styleUrls: ['./membership.component.scss']
})
export class MembershipComponent implements OnInit {
  selectedPlan: any = null;
  userData = {
    name: '',
    email: '',
    phone: ''
  };

  memberships = [
    {
      id: 1,
      title: 'Plan Básico',
      price: 50000,
      currency: 'cop',
      description: 'Acceso al gimnasio y clases básicas'
    },
    {
      id: 2,
      title: 'Plan Premium',
      price: 70000,
      currency: 'cop',
      description: 'Acceso ilimitado + entrenador personal (2/mes)'
    },
    {
      id: 3,
      title: 'Plan Elite',
      price: 90000,
      currency: 'cop',
      description: 'VIP + entrenador personal (4/mes) + nutricionista'
    }
  ];

  constructor(
    private paymentService: PaymentService,
    private http: HttpClient,
    private router: Router
  ) {}

   ngOnInit(): void {
    const navState = history.state as { plan?: any };
this.selectedPlan = navState.plan || null;
  }

  selectPlan(plan: any) {
    this.selectedPlan = plan;
  }

  async checkout() {
    if (!this.selectedPlan) {
      alert('Selecciona un plan primero');
      return;
    }

    try {
      const result = await this.paymentService.pay(
        this.selectedPlan.price,
        this.selectedPlan.currency,
        this.selectedPlan.description
      );

      if (result.paymentIntent?.status === 'succeeded') {
        console.log('✅ Pago exitoso');

        // Registrar membresía en backend
        this.http.post('http://localhost:8080/memberships/create', {
          userId: 1, // ⚠️ luego debes usar el ID real del usuario logueado
          membershipTypeId: this.selectedPlan.id,
          mainLocationId: 3,
          paymentIntentId: result.paymentIntent.id
        }).subscribe(() => {
          alert('🎉 Membresía creada con éxito');
          this.router.navigate(['/home']);
        });
      } else {
        console.error('❌ Pago fallido', result.error?.message);
        alert('Error en el pago: ' + result.error?.message);
      }
    } catch (err) {
      console.error('Error en el proceso de pago', err);
      alert('Hubo un error al procesar el pago.');
    }
  }
}
