import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-idle-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Sesión por expirar</h2>
    <mat-dialog-content>
      <p>Tu sesión está por expirar debido a inactividad.</p>
      <p>¿Deseas mantener la sesión activa?</p>
      <div class="countdown">
        Tiempo restante: {{ timeLeft }} segundos
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onKeepSession()">Mantener sesión</button>
      <button mat-button color="warn" (click)="onLogout()">Cerrar sesión</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .countdown {
      margin-top: 1rem;
      font-weight: bold;
      color: #f44336;
    }
  `]
})
export class IdleWarningDialogComponent {
  timeLeft: number = 60; // 60 segundos de advertencia
  private countdownInterval: any;

  constructor(
    public dialogRef: MatDialogRef<IdleWarningDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.startCountdown();
  }

  private startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.onLogout();
      }
    }, 1000);
  }

  onKeepSession() {
    clearInterval(this.countdownInterval);
    this.dialogRef.close(true);
  }

  onLogout() {
    clearInterval(this.countdownInterval);
    this.dialogRef.close(false);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
