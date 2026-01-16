import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticatedSignal = signal(false);
  private usernameSignal = signal<string | null>(null);

  // Hardcoded credentials
  private readonly ADMIN_USERNAME = 'admin';
  private readonly ADMIN_PASSWORD = 'admin';

  constructor(private router: Router) {
    // Check if user is already logged in
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUsername = localStorage.getItem('username');
    if (storedAuth === 'true' && storedUsername) {
      this.isAuthenticatedSignal.set(true);
      this.usernameSignal.set(storedUsername);
    }
  }

  get isAuthenticated() {
    return this.isAuthenticatedSignal.asReadonly();
  }

  get username() {
    return this.usernameSignal.asReadonly();
  }

  login(username: string, password: string): boolean {
    if (username === this.ADMIN_USERNAME && password === this.ADMIN_PASSWORD) {
      this.isAuthenticatedSignal.set(true);
      this.usernameSignal.set(username);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', username);
      return true;
    }
    return false;
  }

  logout() {
    this.isAuthenticatedSignal.set(false);
    this.usernameSignal.set(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    this.router.navigate(['/login']);
  }
}
