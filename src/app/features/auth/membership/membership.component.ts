import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

enum MembershipTypeName {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP'
}

interface MembershipPlan {
  id: MembershipTypeName;
  name: string;
  description: string;
  price: number;   // mensual
  duration: number; // fijo: 1 mes
  features: string[];
  isPopular?: boolean;
  color: string;
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

  membershipPlans: MembershipPlan[] = [
    {
      id: MembershipTypeName.BASIC,
      name: 'Básico',
      description: 'Perfecto para comenzar tu journey fitness',
      price: 50000,
      duration: 1, // siempre en meses
      features: [
        'Acceso al área de pesas',
        'solo 2 horas por dia de entrenamiento',
        'Máquinas cardiovasculares',
        'Vestuarios y duchas',
        'Horario: 6AM - 8PM',
        'Solo puede estar en una sucursal'
      ],
      color: '#6B7280'
    },
    {
      id: MembershipTypeName.PREMIUM,
      name: 'Premium',
      description: 'La opción más completa para resultados óptimos',
      price: 70000,
      duration: 1,
      features: [
        'Todo lo del plan básico',
        'Acceso 24/7',
        'Clases grupales ilimitadas',
        'Entrenador personal (2 sesiones/mes)',
        'Área de funcional',
        'Evaluación nutricional',
        'Descuentos en suplementos'
      ],
      isPopular: true,
      color: '#EF4444'
    },
    {
      id: MembershipTypeName.VIP,
      name: 'VIP',
      description: 'El mejor valor para miembros comprometidos',
      price: 90000,
      duration: 1,
      features: [
        'Todo lo del plan Premium',
        'Puede ingresar a cualquier sucursal',
        'Entrenador personal (4 sesiones/mes)',
        'Acceso a sauna y jacuzzi',
        'Plan nutricional personalizado',
        'Invitaciones para amigos (2/mes)',
        'Descuento 20% en productos',
        'Estacionamiento gratis'
      ],
      color: '#F59E0B'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCurrentMembership();
    const nav = this.router.getCurrentNavigation();
    const selectedPlan = nav?.extras.state?.['plan'];
    if (selectedPlan) {
      console.log('Plan preseleccionado desde preview:', selectedPlan);
    }
  }

  private loadCurrentMembership(): void {
    // Simulación - luego conectar con backend
    this.currentMembership = {
      name: 'Plan Premium',
      expiryDate: '15 de Diciembre, 2025'
    };
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  selectPlan(plan: MembershipPlan): void {
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      this.router.navigate(['/register'], { state: { selectedPlan: plan } });
    } else {
      this.router.navigate(['/payment'], { state: { selectedPlan: plan } });
    }
  }

  renewMembership(): void {
    console.log('Renovando membresía...');
  }
}
