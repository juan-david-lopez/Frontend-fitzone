// features/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { tap, catchError, switchMap, mergeMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  RefreshTokenRequest, 
  ResetPasswordRequest,
  OtpVerificationRequest,
  UserResponse
} from '../../core/models/auth.models';

interface UserInfo {
  id: number;
  email: string;
  name?: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_info';
  private readonly API_URL = 'https://desplieguefitzone.onrender.com';
  private readonly OTP_TIMEOUT = 300000; // 5 minutos para el OTP

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isBrowser() ? this.hasToken() : false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private pendingAuthEmail: string | null = null;
  private lastActivity: number = Date.now();
  private readonly INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos
  private activityCheckInterval: any;

  constructor(private http: HttpClient, private router: Router) {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  generateOTP(email: string) {
  return this.http.post(`${this.API_URL}/auth/resend-otp`, null, {
    params: { email }
  });
}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login-2fa`, credentials).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Login inicial exitoso, OTP requerido:', response);
          if (response.status === 'OTP_REQUIRED' || response.step === 1) {
            this.pendingAuthEmail = credentials.email;
          }
        }
      }),
      catchError(error => {
        console.error('❌ Login error:', error);
        let errorMessage = 'Error al iniciar sesión';
        if (error.status === 401) {
          errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else if (error.status === 403) {
          errorMessage = 'Acceso denegado. Contacta al administrador.';
        } else if (error.status === 0 || error.status === 500) {
          errorMessage = 'Error de conexión con el servidor. Intenta nuevamente.';
        }
        return throwError(() => ({
          success: false,
          timestamp: Date.now(),
          error: error.error?.error || errorMessage,
          details: error.error?.details
        }));
      })
    );
  }

validateOTP(email: string, otp: string): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.API_URL}/auth/verify-otp`, null, {
    params: { email, otp }
  }).pipe(
    tap((response: AuthResponse) => {
      if (response.success && response.accessToken) {
        console.log("✅ OTP validado, guardando sesión");
        this.setSession(response);
        this.clearPendingAuth(); // limpiamos el email pendiente
      }
    }),
    catchError(error => {
      console.error('❌ Error en validación OTP:', error);
      return throwError(() => error);
    })
  );
}



  getUserInfo(email: string, token: string): Observable<UserInfo> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // Intentar primero con /users/by-email
    return this.http.get<UserResponse>(`${this.API_URL}/users/by-email`, {
      params: { email },
      headers
    }).pipe(
      catchError(error => {
        console.warn('⚠️ Error en /users/by-email, intentando ruta alternativa:', error);
        // Si falla, intentar con la ruta alternativa
        return this.http.get<UserResponse>(`${this.API_URL}/users/email/${email}`, { headers });
      }),
      map(userResponse => ({
        id: userResponse.idUser,
        email: userResponse.email,
        name: `${userResponse.firstName} ${userResponse.lastName}`
      })),
      catchError(error => {
        console.error('❌ Error obteniendo información del usuario:', error);
        return throwError(() => error);
      })
    );
  }

  private updateLastActivity(): void {
    this.lastActivity = Date.now();
  }

  private setupActivityTracking(): void {
    if (this.isBrowser()) {
      // Limpiar intervalo existente si lo hay
      if (this.activityCheckInterval) {
        clearInterval(this.activityCheckInterval);
      }

      // Eventos para trackear actividad del usuario
      ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(eventName => {
        window.addEventListener(eventName, () => this.updateLastActivity());
      });

      // Verificar inactividad cada minuto
      this.activityCheckInterval = setInterval(() => {
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        if (timeSinceLastActivity >= this.INACTIVITY_TIMEOUT) {
          console.log('⚠️ Inactividad detectada, cerrando sesión...');
          this.logout();
        }
      }, 60000);
    }
  }

  setSession(authResponse: any): void {
    if (!this.isBrowser()) return;
    
    const token = authResponse.accessToken || authResponse.token;
    const refreshToken = authResponse.refreshToken;
    const expiresIn = authResponse.expiresIn || 300; // 5 minutos por defecto
    
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      if (refreshToken) localStorage.setItem(this.REFRESH_KEY, refreshToken);
      
      const expiresAt = new Date().getTime() + (expiresIn * 1000);
      localStorage.setItem('token_expires_at', expiresAt.toString());
      
      this.isAuthenticatedSubject.next(true);
      console.log('✅ Token guardado en localStorage');
      
      this.setupActivityTracking();
      
      if (refreshToken) {
        const refreshTime = Math.min((expiresIn * 0.75) * 1000, 240000);
        setTimeout(() => {
          if (Date.now() - this.lastActivity < this.INACTIVITY_TIMEOUT) {
            this.refreshToken().subscribe({
              next: (response) => {
                console.log('✅ Token renovado automáticamente');
                this.setSession(response);
              },
              error: (error: any) => {
                console.error('❌ Error en renovación automática:', error);
              }
            });
          }
        }, refreshTime);
      }
    } else {
      console.warn('⚠️ No se recibió token en la respuesta:', authResponse);
    }
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay token de renovación disponible'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthResponse>(
      `${this.API_URL}/auth/refresh`, 
      request,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    ).pipe(
      tap(response => {
        if (response.success && response.accessToken) {
          this.setSession(response);
        } else {
          throw new Error('No se recibió un token válido del servidor');
        }
      }),
      catchError(error => {
        console.error('❌ Error en refresh token:', error);
        if (error.status === 401 || error.status === 403) {
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }
  
  checkTokenValidity(): Observable<any> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();

    if (!token) {
      return throwError(() => new Error('No hay token disponible'));
    }

    if (refreshToken) {
      return this.refreshToken().pipe(
        tap(response => {
          console.log('✅ Token renovado preventivamente');
          this.setSession(response);
        }),
        catchError(error => {
          console.error('❌ Error al renovar token:', error);
          return throwError(() => error);
        })
      );
    }

    return this.http.get(`${this.API_URL}/auth/validate-token`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    });
  }

  startTokenValidityCheck(): void {
    const checkInterval = setInterval(() => {
      if (this.isLoggedIn()) {
        const tokenExpiresAt = localStorage.getItem('token_expires_at');
        if (tokenExpiresAt) {
          const expirationTime = parseInt(tokenExpiresAt);
          const currentTime = new Date().getTime();
          
          if (expirationTime - currentTime < 120000) {
            this.refreshToken().subscribe({
              error: (error: any) => {
                console.error('❌ Error en renovación programada:', error);
                if (error.status === 401 || error.status === 403) {
                  clearInterval(checkInterval);
                  this.logout();
                }
              }
            });
          }
        }
      } else {
        clearInterval(checkInterval);
      }
    }, 60000);
  }

  register(data: RegisterRequest): Observable<UserInfo> {
    return this.http.post<AuthResponse>(`${this.API_URL}/users/public/register`, data).pipe(
      tap(response => {
        console.log('✅ Registro exitoso, respuesta:', response);
        if (response.success && response.accessToken) {
          this.setSession(response);
        }
      }),
      switchMap(response => {
        // Intentar obtener información completa del usuario
        return this.getUserInfo(data.email, response.accessToken || '').pipe(
          catchError(() => {
            // Si falla, crear información básica del usuario
            const basicUserInfo: UserInfo = {
              id: response.userId || 0,
              email: data.email,
              name: `${data.firstName} ${data.lastName}`
            };
            this.setUserInfo(basicUserInfo);
            return of(basicUserInfo);
          })
        );
      }),
      catchError(error => {
        console.error('❌ Error en registro:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    if (!this.isBrowser()) return;
    
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
    
    ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(eventName => {
      window.removeEventListener(eventName, () => this.updateLastActivity());
    });
    
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.pendingAuthEmail = null;
    this.isAuthenticatedSubject.next(false);
    
    this.router.navigate(['/login'], {
      queryParams: { 
        expired: 'true',
        message: 'Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.'
      }
    });
  }

  forgotPassword(email: string): Observable<AuthResponse> {
    const params = new URLSearchParams();
    params.append('email', email);

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/forgot-password?${params.toString()}`, {}).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Solicitud de recuperación enviada:', response);
        }
      }),
      catchError(error => {
        console.error('❌ Error en recuperación de contraseña:', error);
        return throwError(() => ({
          success: false,
          timestamp: Date.now(),
          error: error.error?.error || 'Error al procesar la solicitud de recuperación',
          details: error.error?.details
        }));
      })
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/reset-password`, request).pipe(
      tap(response => {
        if (response.success) {
          console.log('✅ Contraseña restablecida exitosamente');
        }
      }),
      catchError(error => {
        console.error('❌ Error al restablecer contraseña:', error);
        return throwError(() => ({
          success: false,
          timestamp: Date.now(),
          error: error.error?.error || 'Error al restablecer la contraseña',
          details: error.error?.details
        }));
      })
    );
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.REFRESH_KEY);
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    if (!this.isBrowser()) return false;
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  setUserInfo(userInfo: UserInfo): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
      console.log('✅ Información de usuario guardada:', userInfo);
    } catch (error) {
      console.warn('Error saving user info:', error);
    }
  }

  getCurrentUser(): UserInfo | null {
    if (!this.isBrowser()) return null;
    try {
      const userInfo = localStorage.getItem(this.USER_KEY);
      if (!userInfo) return null;
      
      const parsedInfo = JSON.parse(userInfo);
      if (!parsedInfo.id || !parsedInfo.email) {
        console.warn('⚠️ Información de usuario incompleta:', parsedInfo);
        return null;
      }
      
      return parsedInfo;
    } catch (error) {
      console.warn('❌ Error al procesar información del usuario:', error);
      return null;
    }
  }

  getPendingEmail(): string | null {
    return this.pendingAuthEmail;
  }

  clearPendingAuth(): void {
    this.pendingAuthEmail = null;
  }
}
