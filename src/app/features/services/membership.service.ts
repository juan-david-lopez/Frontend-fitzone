import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

// El monto debe ser en centavos y como entero para Stripe
export interface PaymentIntentRequest {
  amount: number;      // Monto en centavos (ej: $10.00 = 1000)
  currency: string;    // Código de moneda (ej: 'usd')
  description: string; // Descripción del pago
  metadata?: {
    plan_id: string;
    original_amount_cop: string;
    user_email: string;
  }
}

export interface PaymentIntentResponse {
  clientSecret: string;
}

export interface ConfirmPaymentResponse {
  status: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface CreateMembershipRequest {
  userId: number;        // Long en el backend
  MembershipTypeId: number;  // Long en el backend (mantener la M mayúscula para coincidir con el backend)
  mainLocationId: number;    // Long en el backend
  paymentIntentId: string;   // String en el backend
}

export interface MembershipResponse {
  id: number;
  userId: number;
  membershipTypeName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  startDate: string;
  endDate: string;
  mainLocationId: number;
}

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private apiUrl = 'https://desplieguefitzone.onrender.co/memberships';
  private currentMembershipSubject = new BehaviorSubject<MembershipResponse | null>(null);
  currentMembership$ = this.currentMembershipSubject.asObservable();

  constructor(private http: HttpClient) {
    // Intentar cargar la membresía del usuario al iniciar el servicio
    const userId = this.getCurrentUserId();
    if (userId) {
      this.getMembershipByUserId(userId).subscribe(
        membership => this.currentMembershipSubject.next(membership)
      );
    }
  }

  private getCurrentUserId(): number | null {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.id || null;
  }

  createPaymentIntent(request: PaymentIntentRequest): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(`${this.apiUrl}/create-payment-intent`, request);
  }

  // El backend maneja la confirmación del pago directamente en Stripe,
  // no necesitamos un endpoint específico para confirmar

  createMembership(request: CreateMembershipRequest): Observable<MembershipResponse> {
    return this.http.post<MembershipResponse>(`${this.apiUrl}/create`, request);
  }

  getMembershipByUserId(userId: number): Observable<MembershipResponse> {
    return this.http.get<MembershipResponse>(`${this.apiUrl}/${userId}`);
  }

  updateCurrentMembership(membership: MembershipResponse) {
    this.currentMembershipSubject.next(membership);
  }

  getCurrentMembership(): MembershipResponse | null {
    return this.currentMembershipSubject.value;
  }
}