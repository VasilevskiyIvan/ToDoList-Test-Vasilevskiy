import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, switchMap, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoadingUser$.pipe(
    filter(isLoading => !isLoading),
    take(1),
    switchMap(() => authService.user$),
    map(user => {
      if (user) {
        return true;
      }
      router.navigate(['/welcome']);
      return false;
    })
  );
};