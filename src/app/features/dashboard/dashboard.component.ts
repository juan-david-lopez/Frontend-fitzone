import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MembershipService, MembershipResponse } from '../services/membership.service';
import { WebSocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  userName: string = 'Usuario';
  userEmail: string = '';
  todayDate: string = '';
  private websocketSubscription!: Subscription;
  private currentUserId: number | null = null; // ✅ Añadir esta propiedad

  membershipStatus = {
    isActive: false,
    expiryDate: '',
    isLoading: true,
    error: false
  };

  todayStats = {
    workouts: 0,
    timeSpent: 0,
    calories: 0,
    visits: 0
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private membershipService: MembershipService,
    private websocketService: WebSocketService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadTodayDate();
    this.loadTodayStats();
    this.loadMembershipStatus();
    this.setupWebSocketListener();
    if (isPlatformBrowser(this.platformId)) {
      this.setupWebSocketListener();
    }
  }

  ngOnDestroy(): void {
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
  }

  private loadUserInfo(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userEmail = currentUser.email || '';
      this.userName = currentUser.name || this.extractNameFromEmail(this.userEmail);
      this.currentUserId = currentUser.id; // ✅ Asignar el ID del usuario
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
    // Datos de ejemplo, puedes reemplazar por real stats
    this.todayStats = {
      workouts: 1,
      timeSpent: 45,
      calories: 320,
      visits: 1
    };
  }

  private loadMembershipStatus(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.membershipStatus.isLoading = false;
      return;
    }

    this.membershipService.getMembershipByUserId(currentUser.id).subscribe({
      next: (membership: MembershipResponse) => {
        this.membershipStatus = {
          isActive: membership.status === 'ACTIVE',
          expiryDate: new Date(membership.endDate)
            .toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
          isLoading: false,
          error: false
        };
        
        console.log('Estado de membresía cargado:', {
          status: membership.status,
          isActive: this.membershipStatus.isActive,
          endDate: membership.endDate
        });
      },
      error: (err) => {
        console.error('Error cargando membresía:', err);
        this.membershipStatus = {
          isActive: false,
          expiryDate: '',
          isLoading: false,
          error: true
        };
      }
    });
  }

  // Método público para refrescar membresía (útil después de activaciones)
  public refreshMembershipStatus(): void {
    this.membershipStatus.isLoading = true;
    this.membershipStatus.error = false;
    setTimeout(() => {
      this.loadMembershipStatus();
    }, 2000);
  }

  getUserInitials(): string {
    const names = this.userName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0]?.charAt(0)?.toUpperCase() || 'U';
  }

  // Navegaciones para el template
  navigateToMemberships(): void {
    this.router.navigate(['/memberships']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToStats(): void {
    this.router.navigate(['/stats']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private setupWebSocketListener(): void {
    this.websocketSubscription = this.websocketService
      .getMembershipUpdates()
      .subscribe({
        next: (membershipUpdate) => {
          if (membershipUpdate && this.currentUserId) {
            console.log('🔄 Actualización recibida:', membershipUpdate);
            if (membershipUpdate.userId === this.currentUserId) {
              this.handleMembershipUpdate(membershipUpdate);
            }
          }
        },
        error: (err) => {
          console.error('❌ Error en WebSocket:', err);
        }
      });
  }
  private handleMembershipUpdate(membershipData: any): void {
    // Actualizar el estado de la membresía con los nuevos datos
    this.membershipStatus = {
      isActive: membershipData.status === 'ACTIVE',
      expiryDate: this.formatDate(membershipData.endDate),
      isLoading: false,
      error: false
    };

    // Mostrar notificación de éxito
    this.showSuccessNotification('Membresía activada exitosamente!');
    
    console.log('✅ Dashboard actualizado con nueva membresía:', membershipData);
  }

  private showSuccessNotification(message: string): void {
    // Puedes implementar un toast o notificación aquí
    console.log('🎉 ' + message);
    // Ejemplo con alerta nativa (puedes reemplazar por un componente de notificación)
    alert(message);
  }

  private formatDate(dateString: string): string {
    try {
      return new Date(dateString)
        .toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
    } catch (error) {
      console.error('❌ Error formateando fecha:', error);
      return dateString;
    }
  }
}