// auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.auth.isAuthenticated()) {
      return this.router.parseUrl('/auth/login');
    }

    const allowedRoles = route.data['roles'] as number[] | undefined;
    if (allowedRoles) {
      const userRol = this.auth.getRolId();
      if (!allowedRoles.includes(userRol!)) {
        return this.router.parseUrl('/pages/home'); // o redirige al home
      }
    }

    return true;
  }
}
