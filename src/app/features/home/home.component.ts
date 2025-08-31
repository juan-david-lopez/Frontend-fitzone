import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  memberships = [
    {
      title: 'Plan Básico',
      price: '$50.000/mes',
      features: [
        'Acceso al gimnasio',
        'Clases básicas',
        'Casillero estándar'
      ]
    },
    {
      title: 'Plan Premium',
      price: '$70.000/mes',
      features: [
        'Acceso ilimitado al gimnasio',
        'Todas las clases incluidas',
        'Casillero premium',
        'Entrenador personal (2 sesiones/mes)'
      ]
    },
    {
      title: 'Plan Elite',
      price: '$90.000/mes',
      features: [
        'Acceso VIP',
        'Todas las clases incluidas',
        'Casillero premium',
        'Entrenador personal (4 sesiones/mes)',
        'Nutricionista incluido'
      ]
    }
  ];

  constructor(private router: Router) {}

  // Métodos de navegación para todos los enlaces
  navigateToHome() {
    this.router.navigate(['/home']);
  }

  navigateToServices() {
    this.router.navigate(['/services']);
  }

  navigateToSchedule() {
    this.router.navigate(['/schedule']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}