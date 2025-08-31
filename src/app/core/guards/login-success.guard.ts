// core/guards/login-success.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../features/services/auth.service';

export const loginSuccessGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar de manera síncrona si hay token
  const hasToken = authService.isAuthenticated();
  
  if (hasToken) {
    return true;
  } else {
    console.warn('No authenticated, redirecting to login');
    router.navigate(['/login']);
    return false;
  }
};