import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MembershipPlan } from '../../../core/models/membership.model';

interface CurrentMembership {
  name: string;
  expiryDate: string;
}

@Component({
  selector: 'app-memberships',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './membership.component.html',
  styleUrls: ['./membership.component.scss']
})
export class MembershipsComponent implements OnInit {
  currentMembership: CurrentMembership | null = null;
  preselectedPlan: MembershipPlan | null = null;

  // Mantén tu estructura actual de planes
  membershipPlans: MembershipPlan[] = [
    {
      id: 'BASIC',
      name: 'Básico',
      description: 'Perfecto para comenzar tu journey fitness',
      price: 50000,
      duration: 1,
      features: [
        'Acceso al área de pesas',
        '2 horas diarias de entrenamiento',
        'Máquinas cardiovasculares',
        'Vestuarios y duchas',
        'Horario: 6AM - 8PM',
        'Acceso a una sola sucursal'
      ]
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      description: 'La opción más completa para resultados óptimos',
      price: 70000,
      duration: 1,
      features: [
        'Todo lo del plan básico',
        'Acceso 24/7 con tiempo ilimitado',
        'Clases grupales ilimitadas',
        'Entrenador personal (2 sesiones/mes)',
        'Área de funcional',
        'Evaluación nutricional',
        'Gamificación y retos mensuales'
      ],
      isPopular: true
    },
    {
      id: 'VIP',
      name: 'VIP',
      description: 'El mejor valor para miembros comprometidos',
      price: 90000,
      duration: 1,
      features: [
        'Todo lo del plan Premium',
        'Acceso a cualquier sucursal',
        'Entrenador personal (4 sesiones/mes)',
        'Sauna y jacuzzi',
        'Plan nutricional personalizado',
        'Invitaciones para amigos (2/mes)',
        '20% de descuento en reservas de espacios'
      ]
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadPreselectedPlan();
  }

  private loadPreselectedPlan(): void {
    // ✅ Cargamos el plan que viene del Preview
    const navigation = this.router.getCurrentNavigation();
    const planFromState = navigation?.extras?.state?.['plan'] || history.state?.plan;

    if (planFromState) {
      console.log('Plan recibido desde preview:', planFromState);
      
      // Convertir el plan del home a la estructura que espera este componente
      this.preselectedPlan = this.convertHomePlanToMembershipPlan(planFromState);
    }
  }

  private convertHomePlanToMembershipPlan(homePlan: any): MembershipPlan {
    // Mapear los planes del home a la estructura de MembershipPlan
    const planMap: {[key: string]: MembershipPlan} = {
      'Plan Básico': this.membershipPlans.find(p => p.id === 'BASIC')!,
      'Plan Premium': this.membershipPlans.find(p => p.id === 'PREMIUM')!,
      'Plan Elite': this.membershipPlans.find(p => p.id === 'VIP')!
    };

    return planMap[homePlan.title] || this.membershipPlans[0];
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  selectPlan(plan: MembershipPlan): void {
    // Convertir el ID a número si es necesario
    const processedPlan = {
      ...plan,
      id: plan.id || 'BASIC', // Usar un valor por defecto si id es undefined
    };
    
    // Guardar el plan procesado en sessionStorage
    sessionStorage.setItem('selectedPlan', JSON.stringify(processedPlan));
    console.log('Plan guardado en sessionStorage:', processedPlan);
    
    const token = localStorage.getItem('token');
    if (!token) {
      // No hay sesión → ir a registro
      this.router.navigate(['/register']);
    } else {
      // Ya tiene sesión → ir a pago directo
      this.proceedToPayment(processedPlan);
    }
  }

  proceedToPayment(selectedPlan: MembershipPlan) {
    console.log('📍 Navegando a payment con plan:', selectedPlan);
    
    // Guardar en sessionStorage como respaldo
    sessionStorage.setItem('selectedPlan', JSON.stringify(selectedPlan));
    
    // Navegar a la página de pago con el plan seleccionado
    this.router.navigate(['/payment'], { 
      state: { selectedPlan: selectedPlan } 
    }).then(success => {
      if (success) {
        console.log('✅ Navegación exitosa a payment');
      } else {
        console.error('❌ Error en la navegación a payment');
      }
    }).catch(error => {
      console.error('❌ Error al navegar a payment:', error);
    });
  }

}