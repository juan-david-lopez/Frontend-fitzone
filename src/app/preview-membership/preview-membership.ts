import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-preview-membership',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-membership.component.html',
  styleUrls: ['./preview-membership.component.scss']
})
export class PreviewMembershipComponent {
  plan: any;

  constructor(private route: ActivatedRoute, private router: Router) {
    // Recibimos el plan desde el Home
    const nav = this.router.getCurrentNavigation();
    this.plan = nav?.extras.state?.['plan'];
  }

  continue() {
    // Navegar a memberships con el plan seleccionado
    this.router.navigate(['/memberships'], { state: { plan: this.plan } });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
