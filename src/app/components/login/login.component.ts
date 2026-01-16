import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = signal('');
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  updateUsername(value: string) {
    this.username.set(value);
    this.errorMessage.set('');
  }

  updatePassword(value: string) {
    this.password.set(value);
    this.errorMessage.set('');
  }

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const success = this.authService.login(this.username(), this.password());

    this.isLoading.set(false);

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage.set('Invalid username or password');
      this.password.set('');
    }
  }
}
