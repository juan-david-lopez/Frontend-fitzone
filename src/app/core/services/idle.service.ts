import { Injectable, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../features/services/auth.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { IdleWarningDialogComponent } from '../../shared/components/idle-warning-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class IdleService {
  private readonly TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos
  private idleTimer: any;
  private lastActivity: number = Date.now();

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Solo inicializar el monitoreo en el navegador, no en el servidor
    if (isPlatformBrowser(this.platformId)) {
      this.setupActivityMonitoring();
    }
  }

  private setupActivityMonitoring(): void {
    // Lista de eventos que resetean el temporizador de inactividad
    const events = [
      'mousemove',
      'keydown',
      'wheel',
      'touchstart',
      'click'
    ];

    // Agregar listeners para cada evento
    events.forEach(eventName => {
      window.addEventListener(eventName, () => this.resetTimer());
    });

    // Iniciar el temporizador
    this.startTimer();
  }

  private startTimer(): void {
    this.ngZone.runOutsideAngular(() => {
      this.idleTimer = setInterval(() => {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;

        if (timeSinceLastActivity >= this.TIMEOUT && this.authService.isLoggedIn()) {
          this.ngZone.run(() => {
            console.log('⏰ Usuario inactivo por 5 minutos');
            this.handleTimeout();
          });
        }
      }, 10000); // Revisar cada 10 segundos
    });
  }

  private resetTimer(): void {
    this.lastActivity = Date.now();
  }

  private async handleTimeout(): Promise<void> {
    // Mostrar diálogo de advertencia 1 minuto antes
    const warningTimeout = this.TIMEOUT - (60 * 1000); // 1 minuto antes
    const timeSinceLastActivity = Date.now() - this.lastActivity;

    if (timeSinceLastActivity >= warningTimeout) {
      // Limpiar el timer actual
      if (this.idleTimer) {
        clearInterval(this.idleTimer);
      }

      // Mostrar el diálogo de advertencia
      const dialogRef = this.dialog.open(IdleWarningDialogComponent, {
        width: '400px',
        disableClose: true // El usuario debe tomar una decisión
      });

      const result = await dialogRef.afterClosed().toPromise();

      if (result === true) {
        // Usuario quiere mantener la sesión
        console.log('✅ Sesión renovada por el usuario');
        this.resetTimer();
        this.startTimer();
      } else {
        // Proceder con el cierre de sesión
        this.performLogout();
      }
    }
  }

  private performLogout(): void {
    // Guardar cualquier estado necesario antes de cerrar sesión
    const currentUrl = this.router.url;
    if (currentUrl.includes('payment')) {
      const selectedPlan = sessionStorage.getItem('selectedPlan');
      if (selectedPlan) {
        console.log('💾 Guardando plan seleccionado antes de cerrar sesión por inactividad');
      }
    }

    // Cerrar sesión y redirigir
    this.authService.logout();
    this.router.navigate(['/login'], { 
      queryParams: { 
        expired: 'true',
        message: 'Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.',
        returnUrl: currentUrl
      }
    });
  }

  // Método público para detener el monitoreo 
  public stopMonitoring(): void {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
    }
  }

  // Método público para reiniciar el monitoreo
  public restartMonitoring(): void {
    this.resetTimer();
    this.startTimer();
  }
}
