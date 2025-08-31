// main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { routes } from './app/app.routes'; // 🔹 cambia a 'routes'

bootstrapApplication(App, {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withFetch() // ⚡ habilita fetch
    ),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
