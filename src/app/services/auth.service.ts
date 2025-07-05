import { Injectable } from '@angular/core';
import {
  Auth,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from '@angular/fire/auth';
import { BehaviorSubject, from } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _user = new BehaviorSubject<User | null>(null);
  public readonly user$ = this._user.asObservable();

  private _userId = new BehaviorSubject<string | null>(null);
  public readonly userId$ = this._userId.asObservable();

  private _isLoadingUser = new BehaviorSubject<boolean>(true);
  public readonly isLoadingUser$ = this._isLoadingUser.asObservable();

  constructor(private auth: Auth, private router: Router) {
    onAuthStateChanged(this.auth, user => {
      this._user.next(user);
      this._userId.next(user ? user.uid : null);
      this._isLoadingUser.next(false);
    });

    from(getRedirectResult(this.auth)).subscribe({
      next: (result) => {
        if (result) {
          console.log("Logged in with Google via redirect:", result.user);
          this.router.navigate(['/tasks']);
        } else {
          console.log("No redirect result or user not logged in yet.");
        }
      },
      error: (error) => {
        console.error("Error processing redirect result:", error);
      }
    });
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(this.auth, provider);
    } catch (error: any) {
      console.error("Error during Google login redirect initiation:", error);
      if (error.code === 'auth/popup-blocked') {
        alert('Всплывающее окно заблокировано. Пожалуйста, разрешите всплывающие окна для этого сайта.');
      }
    }
  }

  logout(): void {
    signOut(this.auth).then(() => {
      this.router.navigate(['/welcome']);
    }).catch(error => {
      console.error("Error during logout:", error);
    });
  }

  get currentUserId(): string | null {
    return this._userId.getValue();
  }
}