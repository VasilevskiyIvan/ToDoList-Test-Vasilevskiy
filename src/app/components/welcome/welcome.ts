import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss'
})
export class Welcome {
  constructor(private authService: AuthService) { }

  login(): void {
    this.authService.loginWithGoogle();
  }
}