// core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../features/services/auth.service';
import { AuthResponse } from '../../core/models/auth.models';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  let authReq = req;
  if (token && !isAuthUrl(req.url)) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token && !isAuthUrl(req.url)) {
        // Intentar renovar el token
        return authService.refreshToken().pipe(
          switchMap((response: AuthResponse) => {
            const newToken = response.accessToken;
            if (newToken) {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(retryReq);
            } else {
              // Si no hay nuevo token, redirigir al login
              authService.logout();
              return throwError(() => new Error('Refresh token failed'));
            }
          }),
          catchError((refreshError) => {
            // Si el refresh falla, redirigir al login
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      } else if (error.status === 401) {
        // Token inválido pero no podemos renovarlo, redirigir al login
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};

function isAuthUrl(url: string): boolean {
  return url.includes('/auth/login') || 
         url.includes('/auth/login-2fa') ||
         url.includes('/auth/verify-otp') ||
         url.includes('/auth/refresh') ||
         url.includes('/users/public/register') ||
         url.includes('/auth/forgot-password') ||
         url.includes('/auth/reset-password') ||
         url.includes('/auth/generate-otp') ||
         url.includes('/auth/resend-otp');
}