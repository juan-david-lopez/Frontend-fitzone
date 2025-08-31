// core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../features/services/auth.service';
import { AuthResponse } from '../../core/models/auth.models';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;
  if (token && !isAuthUrl(req.url)) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthUrl(req.url)) {
        return authService.refreshToken().pipe(
          switchMap((response: AuthResponse) => {
          const newToken = response.accessToken;
          const retryReq = req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` }
        });
    return next(retryReq);
  })
);
      }

      return throwError(() => error);
    })
  );
};

function isAuthUrl(url: string): boolean {
  return url.includes('/auth/login') || 
         url.includes('/auth/refresh') ||
         url.includes('/users/register') ||
         url.includes('/auth/forgot-password') ||
         url.includes('/auth/reset-password');
}
  