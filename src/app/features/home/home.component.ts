import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;

  memberships = [
    {
      title: 'Plan Básico',
      price: '$50.000/mes',
      features: [
        'Acceso al área de pesas',
        'solo 2 horas por dia de entrenamiento',
        'Máquinas cardiovasculares',
        'Vestuarios y duchas',
        'Solo puede estar en una sucursal'
      ],
    },
    {
      title: 'Plan Premium',
      price: '$70.000/mes',
      features: [
        'Todo lo del plan básico',
        'Acceso 24/7',
        'Entrenador personal (2 sesiones/mes)',
        'Evaluación nutricional',
        'Invitaciones para amigos (1/mes)'
      ],
    },
    {
      title: 'Plan Elite',
      price: '$90.000/mes',
      features: [
        'Todo lo del plan Premium',
        'Puede ingresar a cualquier sucursal',
        'Entrenador personal (4 sesiones/mes)',
        'Plan nutricional personalizado',
        'Invitaciones para amigos (3/mes)',
        'Nutricionista incluido'
      ]
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  goToCheckout(plan: any) {
    if (!this.isLoggedIn) {
      this.router.navigate(['/membership']);
      return;
    }
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.logout(); 
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
  goToMemberships(plan: any) {
  this.router.navigate(['/preview-membership'], { state: { plan } });
  }


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
