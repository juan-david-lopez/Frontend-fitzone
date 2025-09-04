import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl:'./dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userName: string = 'Usuario';
  userEmail: string = '';
  todayDate: string = '';

  // Datos simulados - reemplazar con servicio real
  membershipStatus = {
    isActive: false, // Cambia a true para probar estado activo
    expiryDate: '15 de Diciembre, 2024'
  };

  todayStats = {
    workouts: 0,
    timeSpent: 0,
    calories: 0,
    visits: 0
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadTodayDate();
    this.loadTodayStats();
  }

  private loadUserInfo(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userEmail = currentUser.email || '';
      this.userName =  this.extractNameFromEmail(this.userEmail);
    }
  }

  private extractNameFromEmail(email: string): string {
    if (!email) return 'Usuario';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private loadTodayDate(): void {
    const today = new Date();
    this.todayDate = today.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private loadTodayStats(): void {
    // Aquí cargarías las estadísticas reales del día
    // Por ahora usamos datos de ejemplo
    this.todayStats = {
      workouts: 1,
      timeSpent: 45,
      calories: 320,
      visits: 1
    };
  }

  getUserInitials(): string {
    const names = this.userName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0]?.charAt(0)?.toUpperCase() || 'U';
  }

  // Métodos de navegación - por ahora solo console.log
  navigateToProfile(): void {
    console.log('Navegando a perfil...');
    // this.router.navigate(['/profile']);
  }

  navigateToStats(): void {
    console.log('Navegando a estadísticas...');
    // this.router.navigate(['/stats']);
  }

  navigateToMemberships(): void {
    console.log('Navegando a membresías...');
    this.router.navigate(['/memberships']);
  }

  navigateToSettings(): void {
    console.log('Navegando a configuración...');
    // this.router.navigate(['/settings']);
  }

  logout(): void {
  this.authService.logout();   // Limpia token y user
  this.router.navigate(['/login']); // Redirige al login
}

}