import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { OTPComponent } from './features/auth/OTP/otp.component';

export const routes: Routes = [
  // Redirect root to home
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [() => guestGuard],
    component: LoginComponent
  },
  {
    path: 'otp', 
    canActivate: [() => guestGuard],
    component: OTPComponent
  },
  {
    path: 'dashboard',
  canActivate: [authGuard],
  loadChildren: () =>
    import('./features/dashboard/dashboard.routes')
      .then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'register',
    canActivate: [() => guestGuard],
    component: RegisterComponent
  },
  // Home route
  {
    path: 'home',
    component: HomeComponent
  },
  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: 'home'
  }
];