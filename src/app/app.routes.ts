import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () => import('./components/welcome/welcome').then(m => m.Welcome)
  },
  {
    path: 'tasks',
    loadComponent: () => import('./components/task-list/task-list').then(m => m.TaskList),
    canActivate: [authGuard]
  },
  {
    path: 'tasks/add',
    loadComponent: () => import('./components/task-form/task-form').then(m => m.TaskForm),
    canActivate: [authGuard]
  },
  {
    path: 'tasks/:id',
    loadComponent: () => import('./components/task-detail/task-detail').then(m => m.TaskDetail),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },
  { path: '**', redirectTo: '/tasks' }
];