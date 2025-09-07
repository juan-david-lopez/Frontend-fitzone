import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../features/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const httpErrorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);
  
  const RETRY_COUNT = 2;
  const RETRY_DELAY = 1000;

  const shouldRetry = (req: HttpRequest<unknown>): boolean => {
    const noRetryEndpoints = ['login', 'verify-otp', 'refresh'];
    return !noRetryEndpoints.some(endpoint => req.url.includes(endpoint));
  };

  const handleUnauthorized = (): void => {
    authService.logout();
    router.navigate(['/login'], {
      queryParams: {
        expired: 'true',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
      }
    });
  };

  const showError = (message: string): void => {
    snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  };

  return next(request).pipe(
    retry({
      count: shouldRetry(request) ? RETRY_COUNT : 0,
      delay: RETRY_DELAY
    }),
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (!navigator.onLine) {
        errorMessage = 'No hay conexión a internet';
      } else if (error.status === 0) {
        errorMessage = 'No se puede conectar con el servidor. Por favor, verifica que el backend esté ejecutándose.';
        console.error('❌ Error de conexión:', error);
      } else {
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Solicitud incorrecta';
            break;
          case 401:
            if (!request.url.includes('login') && !request.url.includes('refresh')) {
              handleUnauthorized();
            }
            errorMessage = 'No autorizado';
            break;
          case 403:
            errorMessage = 'Acceso denegado';
            break;
          case 404:
            errorMessage = 'Recurso no encontrado';
            break;
          case 500:
            errorMessage = 'Error en el servidor. Por favor, intenta más tarde';
            console.error('❌ Error del servidor:', error);
            break;
          default:
            console.error('❌ Error no manejado:', error);
        }
      }

      showError(errorMessage);
      return throwError(() => ({
        error: error.error,
        status: error.status,
        message: errorMessage
      }));
    })
  );
};
