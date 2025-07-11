// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
	private TOKEN_KEY = 'jwt-magistrack-bc';
	private USER_KEY = 'usuario-magistrack-bc';

	getToken(): string | null {
		return localStorage.getItem(this.TOKEN_KEY);
	}

	getUsuario(): any {
		const data = localStorage.getItem(this.USER_KEY);
		return data ? JSON.parse(data) : null;
	}

	isTokenExpired(): boolean {
		const token = this.getToken();
		if (!token) return true;

		const payload = this.decodePayload(token);
		if (!payload || !payload.exp) return true;

		const now = Math.floor(Date.now() / 1000);
		return payload.exp < now;
	}

	private decodePayload(token: string): any {
		try {
			const payloadBase64 = token.split('.')[1];
			const decoded = atob(payloadBase64);
			return JSON.parse(decoded);
		} catch (e) {
			return null;
		}
	}

	isAuthenticated(): boolean {
		return (
			!!this.getToken() && !!this.getUsuario() && !this.isTokenExpired()
		);
	}

	// auth.service.ts
	getRolId(): number | null {
		const user = this.getUsuario();
		return user?.rol?.idRol ?? null;
	}
}
