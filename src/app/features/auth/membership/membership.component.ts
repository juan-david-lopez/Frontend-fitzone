import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Mantén tu interfaz existente sin cambios grandes
interface MembershipPlan {
  id?: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  isPopular?: boolean;
}

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
  const isLoggedIn = localStorage.getItem('access_token'); 

  if (!isLoggedIn) {
    // No hay sesión → ir a registro
    this.router.navigate(['/register'], { state: { selectedPlan: plan } });
  } else {
    // Ya tiene sesión → ir a pago directo
    this.router.navigate(['/payment'], { state: { selectedPlan: plan } });
  }
}

}