// core/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../features/services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated: boolean) => {
      if (isAuthenticated) {
        return true;
      } else {
        console.warn('Access denied, redirecting to login');
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    })
  );
};

// Guard para invitados (redirige si ya está autenticado)
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated: boolean) => {
      if (!isAuthenticated) {
        return true;
      } else {
        console.log('User already authenticated, redirecting to home');
        router.navigate(['/home']);
        return false;
      }
    })
  );
};
