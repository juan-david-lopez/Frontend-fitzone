import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { OTPComponent } from './features/auth/OTP/otp.component';
import { PreviewMembershipComponent } from './preview-membership/preview-membership';
import { MembershipsComponent } from './features/auth/membership/membership.component';
import { PaymentComponent } from './features/auth/payment/payment.component';

export const routes: Routes = [
  // Redirect root to home
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // Auth
  {
    path: 'login',
    canActivate: [() => guestGuard],
    component: LoginComponent
  },
  {
    path: 'register',
    canActivate: [() => guestGuard],
    component: RegisterComponent
  },
  {
    path: 'otp',
    canActivate: [() => guestGuard],
    component: OTPComponent
  },

  // Dashboard (lazy)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes')
        .then(m => m.DASHBOARD_ROUTES)
  },

  // Home
  {
    path: 'home',
    component: HomeComponent
  },

  // Membership flow
  {
    path: 'preview-membership',
    component: PreviewMembershipComponent
  },
  {
    path: 'memberships',
    component: MembershipsComponent
  },
  {
    path: 'payment',
    canActivate: [authGuard], // 🔒 Solo usuarios autenticados
    component: PaymentComponent
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'home'
  }
];
