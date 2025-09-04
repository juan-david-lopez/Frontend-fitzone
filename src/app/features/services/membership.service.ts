// membership.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MembershipType {
  idMembershipType: number;
  name: 'BASIC' | 'PREMIUM' | 'VIP';
  description: string;
  monthlyPrice: number;
  accessToAllLocation: boolean;
  groupClassesSessionsIncluded: number;
  personalTrainingIncluded: number;
  specializedClassesIncluded: boolean;
}

export interface MembershipSubscription {
  userId: number;
  membershipTypeId: number;
}

export interface MembershipSubscriptionResponse {
  subscriptionId: number;
  userId: number;
  userName: string;
  membershipTypeId: number;
  membershipTypeName: string;
  membershipDescription: string;
  monthlyPrice: number;
  subscriptionDate: string;
  expirationDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // Obtener todos los tipos de membresía desde el backend
  getAllMembershipTypes(): Observable<MembershipType[]> {
    return this.http.get<MembershipType[]>(`${this.apiUrl}/membership-types`);
  }

  // Obtener un tipo de membresía específico por ID
  getMembershipTypeById(id: number): Observable<MembershipType> {
    return this.http.get<MembershipType>(`${this.apiUrl}/membership-types/${id}`);
  }

  // Suscribirse a una membresía
  subscribeToMembership(subscription: MembershipSubscription): Observable<MembershipSubscriptionResponse> {
    return this.http.post<MembershipSubscriptionResponse>(`${this.apiUrl}/subscriptions`, subscription);
  }

  // Obtener suscripciones de un usuario
  getUserSubscriptions(userId: number): Observable<MembershipSubscriptionResponse[]> {
    return this.http.get<MembershipSubscriptionResponse[]>(`${this.apiUrl}/subscriptions/user/${userId}`);
  }

  // Cancelar suscripción
  cancelSubscription(subscriptionId: number): Observable<MembershipSubscriptionResponse> {
    return this.http.patch<MembershipSubscriptionResponse>(`${this.apiUrl}/subscriptions/${subscriptionId}/cancel`, {});
  }

  // Crear nuevo tipo de membresía (para administradores)
  createMembershipType(membershipType: Omit<MembershipType, 'idMembershipType'>): Observable<MembershipType> {
    return this.http.post<MembershipType>(`${this.apiUrl}/membership-types`, membershipType);
  }
}