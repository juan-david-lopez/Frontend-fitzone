import { Routes } from '@angular/router';
import { MembershipsComponent } from './membership.component';
import { PreviewMembershipComponent } from '../../../preview-membership/preview-membership';
//import { MembershipActivationComponent } from './membership-activation/membership-activation.component';
import { authGuard, guestGuard } from '../../../core/guards/auth.guard';

export const MEMBERSHIP_ROUTES: Routes = [
  {
    path: '',
    component: MembershipsComponent
  },
  {
    path: 'preview',
    component: PreviewMembershipComponent
  },
  /*{
    path: 'activation',
    component: MembershipActivationComponent,
    canActivate: [authGuard]
  }*/
];