import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { PrimeNGConfig } from 'primeng/api';
import { LOCALE_ID } from '@angular/core';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),  
    provideHttpClient(),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'es-PE' }
  ]
};
