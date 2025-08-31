// features/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, AuthResponse } from '../../core/models/auth.models';

interface UserInfo {
  email: string;
  // Puedes agregar más campos si tu backend los devuelve en login/registro
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_info';
  private readonly API_URL = 'http://localhost:8080';

  // Estado reactivo de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    typeof window !== 'undefined' ? this.hasToken() : false
  );
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {}

  // 🔹 Login
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(res => {
        this.setSession(res);
        this.setUserInfo({ email: credentials.email });
      })
    );
  }

  // 🔹 Registro
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/users/register`, data).pipe(
      tap(res => {
        this.setSession(res);
        this.setUserInfo({ email: data.email });
      })
    );
  }

  // 🔹 Refresh token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of({ accessToken: '', refreshToken: '' });
    }
    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(res => this.setSession(res))
    );
  }

  // 🔹 Forgot Password
  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/forgot-password`, { email }).pipe(
      tap(() => console.log(`Password reset request sent for ${email}`)),
      catchError(error => {
        console.error('Forgot password error:', error);
        throw error;
      })
    );
  }

  // 🔹 Logout
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticatedSubject.next(false);
  }

  // 🔹 Obtener usuario actual
  getCurrentUser(): UserInfo | null {
    try {
      const userInfo = localStorage.getItem(this.USER_KEY);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.warn('Error parsing user info:', error);
      return null;
    }
  }

  // 🔹 Obtener tokens
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  // 🔹 Helpers para guards
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResponse.accessToken);
    localStorage.setItem(this.REFRESH_KEY, authResponse.refreshToken);
    this.isAuthenticatedSubject.next(true);
  }

  private setUserInfo(userInfo: UserInfo): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
    } catch (error) {
      console.warn('Error saving user info:', error);
    }
  }
}
