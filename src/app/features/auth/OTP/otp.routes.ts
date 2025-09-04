import { OTPComponent } from './otp.component';
import {LoginComponent} from '../login/login.component'
import {DashboardComponent} from '../../dashboard/dashboard.component'

export const APP_ROUTES = [
  { path: 'login', component: LoginComponent },
  { path: 'otp', component: OTPComponent },
  { path: 'dashboard', component: DashboardComponent }
];