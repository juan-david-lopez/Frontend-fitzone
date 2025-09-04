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
      features: ['Acceso al gimnasio', 'Clases básicas', 'Casillero estándar']
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

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  goToCheckout(plan: any) {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/checkout'], { state: { plan } });
  }

  logout(): void {
    this.authService.logout(); // limpia token y usuario
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
  goToMemberships(plan: any) {
  if (!this.authService.isLoggedIn()) {
    this.router.navigate(['/login']);
    return;
  }
  this.router.navigate(['/memberships'], { state: { plan } });
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
