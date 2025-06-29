import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'magistrack-bc-frontend';

  // src/app/app.component.ts
  constructor(private auth: AuthService, private router: Router, private dataService: DataService) {
    setInterval(() => {
      if (!this.auth.isAuthenticated()) {
        dataService.clearLoggedUser();
        this.router.navigate(['/auth/login']);
      }
    }, 60_000); // cada 60 segundos
  }

}
