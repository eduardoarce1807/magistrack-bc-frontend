/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEsPe from '@angular/common/locales/es-PE';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Registrar los datos del locale
registerLocaleData(localeEs);
registerLocaleData(localeEsPe);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
