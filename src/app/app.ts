import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IdleService } from './core/services/idle.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('fitzone-app');

  constructor(private idleService: IdleService) {}

  ngOnInit() {
    // El servicio se inicializa automáticamente al ser inyectado
  }
}
