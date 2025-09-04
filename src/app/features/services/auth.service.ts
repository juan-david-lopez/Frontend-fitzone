// featues/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, AuthResponse } from '../../core/models/auth.models';

interface UserInfo {
  email: string;
}

interface VerifyOtpResponse {
  success: boolean;
  accessToken: string;
  email: string;
  message: string;
  step: number;
  refreshToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_info';
  private readonly API_URL = 'http://localhost:8080';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isBrowser() ? this.hasToken() : false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private pendingAuthEmail: string | null = null;

  constructor(private http: HttpClient) {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // 🔹 Login - USANDO EL ENDPOINT CORRECTO /auth/login-2fa
  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/auth/login-2fa`, credentials).pipe(
      tap(response => {
        console.log('✅ Login inicial exitoso, OTP requerido:', response);
        this.pendingAuthEmail = credentials.email;
      }),
      catchError(error => {
        console.error('❌ Login error:', error);
        return throwError(() => error);
      })
    );
  }

  // 🔹 GENERAR OTP
  generateOTP(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/generate-otp`, { email }).pipe(
      catchError(error => {
        console.error('❌ Error generando OTP:', error);
        return throwError(() => error);
      })
    );
  }

  // 🔹 VALIDAR OTP - Para OTPComponent
  validateOTP(email: string, otp: string): Observable<any> {
  // Usar URL params
  const params = new URLSearchParams();
  params.append('email', email);
  params.append('otp', otp);

  return this.http.post<any>(`${this.API_URL}/auth/verify-otp?${params.toString()}`, {});
}

  // 🔹 VALIDAR OTP - Versión alternativa con JSON body
  validateOTPWithBody(email: string, otp: string): Observable<any> {
  // Usar JSON body
  return this.http.post<any>(`${this.API_URL}/auth/verify-otp`, { email, otp });
}

  // 🔹 Reenviar OTP
  resendOTP(email: string): Observable<any> {
    const params = new URLSearchParams();
    params.append('email', email);

    return this.http.post<any>(`${this.API_URL}/auth/resend-otp?${params.toString()}`, {}).pipe(
      tap(response => console.log('✅ OTP reenviado:', response)),
      catchError(error => {
        console.error('❌ Error reenviando OTP:', error);
        return throwError(() => error);
      })
    );
  }

  // 🔹 Registro
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/users/public/register`, data).pipe(
      tap(res => {
        this.setSession(res);
        this.setUserInfo({ email: data.email });
      }),
      catchError(error => {
        console.error('❌ Register error:', error);
        return throwError(() => error);
      })
    );
  }

  // 🔹 Forgot Password
  forgotPassword(email: string): Observable<any> {
    const params = new URLSearchParams();
    params.append('email', email);

    return this.http.post<any>(`${this.API_URL}/auth/forgot-password?${params.toString()}`, {}).pipe(
      tap(() => console.log(`Password reset request sent for ${email}`)),
      catchError(error => {
        console.error('❌ Forgot password error:', error);
        return throwError(() => error);
      })
    );
  }

  // 🔹 Logout
  logout(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.pendingAuthEmail = null;
    this.isAuthenticatedSubject.next(false);
  }

  // 🔹 Obtener email pendiente
  getPendingEmail(): string | null {
    return this.pendingAuthEmail;
  }

  // 🔹 Limpiar autenticación pendiente
  clearPendingAuth(): void {
    this.pendingAuthEmail = null;
  }

  // 🔹 Session management
  setSession(authResponse: any): void {
    if (!this.isBrowser()) return;
    
    const token = authResponse.accessToken || authResponse.token;
    const refreshToken = authResponse.refreshToken;
    
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(this.REFRESH_KEY, refreshToken);
      }
      this.isAuthenticatedSubject.next(true);
      console.log('✅ Token guardado en localStorage');
    } else {
      console.warn('⚠️ No se recibió token en la respuesta:', authResponse);
    }
  }

  private setUserInfo(userInfo: UserInfo): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
    } catch (error) {
      console.warn('Error saving user info:', error);
    }
  }

  // 🔹 Métodos de consulta
  isLoggedIn(): boolean {
    return this.hasToken();
  }

  getCurrentUser(): UserInfo | null {
    if (!this.isBrowser()) return null;
    try {
      const userInfo = localStorage.getItem(this.USER_KEY);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.warn('Error parsing user info:', error);
      return null;
    }
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.REFRESH_KEY);
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    if (!this.isBrowser()) return false;
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
  refreshToken(): Observable<AuthResponse> {
  const refreshToken = this.getRefreshToken();
  if (!refreshToken) {
    return throwError(() => new Error('No refresh token available'));
  }
  
  return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, { refreshToken }).pipe(
    tap(res => this.setSession(res)),
    catchError(error => {
      console.error('❌ Refresh token error:', error);
      this.logout();
      return throwError(() => error);
    })
  );
}
}