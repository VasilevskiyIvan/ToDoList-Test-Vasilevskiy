import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
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
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      this.router.navigate(['/tasks']);
    } catch (error) {
    }
  }

  logout(): void {
    signOut(this.auth).then(() => {
      this.router.navigate(['/welcome']);
    });
  }

  get currentUserId(): string | null {
    return this._userId.getValue();
  }
}