// websocket.service.ts
import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

// Importaciones condicionales para evitar errores en SSR
let Client: any = null;
let SockJS: any = null;

if (typeof window !== 'undefined') {
  // Solo importar en el cliente
  import('@stomp/stompjs').then(module => {
    Client = module.Client;
  });
  import('sockjs-client').then(module => {
    SockJS = module.default;
  });
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private stompClient: any = null;
  private connected = false;
  private membershipSubject = new BehaviorSubject<any>(null);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    if (isPlatformBrowser(this.platformId)) {
      // Esperar a que los módulos se carguen
      setTimeout(() => this.initializeWebSocketConnection(), 100);
    }
  }

  private async initializeWebSocketConnection(): Promise<void> {
    if (!Client || !SockJS) {
      console.warn('WebSocket libraries not loaded yet');
      setTimeout(() => this.initializeWebSocketConnection(), 100);
      return;
    }

    try {
      console.log('🔄 Inicializando conexión WebSocket...');
      
      const socket = new SockJS('https://desplieguefitzone.onrender.com/ws-memberships');
      
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        debug: (str: string) => {
          console.log('STOMP:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        onConnect: (frame: any) => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('✅ WebSocket conectado');

          this.stompClient.subscribe('/topic/membership-updates', (message: any) => {
            try {
              const membershipData = JSON.parse(message.body);
              console.log('📨 Mensaje recibido:', membershipData);
              this.membershipSubject.next(membershipData);
            } catch (error) {
              console.error('❌ Error parsing message:', error);
            }
          });
        },
        
        onStompError: (frame: any) => {
          console.error('❌ Error STOMP:', frame);
          this.handleReconnection();
        },
        
        onWebSocketClose: () => {
          console.log('🔌 WebSocket cerrado');
          this.handleReconnection();
        },
        
        onWebSocketError: (error: any) => {
          console.error('❌ Error WebSocket:', error);
          this.handleReconnection();
        }
      });

      this.stompClient.activate();
      
    } catch (error) {
      console.error('❌ Error inicializando WebSocket:', error);
      this.handleReconnection();
    }
  }

  private handleReconnection(): void {
    this.connected = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 3000 * this.reconnectAttempts;
      console.log(`🔄 Reconectando en ${delay}ms...`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.initializeWebSocketConnection();
      }, delay);
    } else {
      console.error('❌ Máximo de intentos de reconexión');
    }
  }

  getMembershipUpdates(): Observable<any> {
    return this.membershipSubject.asObservable();
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.stompClient) {
      this.stompClient.deactivate();
      this.connected = false;
      console.log('🔌 WebSocket desconectado');
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}