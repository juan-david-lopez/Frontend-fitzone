import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface MembershipPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // en meses
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
      id: 1,
      name: 'Básico',
      description: 'Perfecto para comenzar tu journey fitness',
      price: 35000,
      duration: 1,
      features: [
        'Acceso al área de pesas',
        'Máquinas cardiovasculares',
        'Vestuarios y duchas',
        'Horario: 6AM - 10PM'
      ],
      color: '#6B7280'
    },
    {
      id: 2,
      name: 'Premium',
      description: 'La opción más completa para resultados óptimos',
      price: 150000,
      duration: 6,
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
      id: 3,
      name: 'Estándar',
      description: 'Equilibrio perfecto entre precio y beneficios',
      price: 90000,
      duration: 3,
      features: [
        'Todo lo del plan básico',
        'Clases grupales (5/mes)',
        'Área de funcional',
        'Horario extendido: 5AM - 11PM'
      ],
      color: '#10B981'
    },
    {
      id: 4,
      name: 'Anual VIP',
      description: 'El mejor valor para miembros comprometidos',
      price: 480000,
      duration: 12,
      features: [
        'Todo lo del plan Premium',
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
  }

  private loadCurrentMembership(): void {
    // Simulación - aquí luego llamas al servicio backend
    this.currentMembership = {
      name: 'Plan Premium',
      expiryDate: '15 de Diciembre, 2025'
    };
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  selectPlan(plan: MembershipPlan): void {
    console.log('Plan seleccionado:', plan);
    this.router.navigate(['/payment'], {
      queryParams: { planId: plan.id },
      state: { selectedPlan: plan }
    });
  }

  renewMembership(): void {
    console.log('Renovando membresía...');
    // Aquí va la lógica de backend para renovar
  }
}
