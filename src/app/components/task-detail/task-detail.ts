import { ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, catchError, takeUntil, map, startWith } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ITaskDetail } from '../../interfaces/TaskDetail';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskDetail implements OnDestroy, OnInit {
  taskDetailState$: Observable<ITaskDetail>;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService
  ) {
    this.taskDetailState$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return this.taskService.getTaskById(id).pipe(
            map(task => {
              return {
                task: task,
                isLoading: false,
                error: !task
              };
            }),
            catchError(err => {
              return of({
                task: undefined,
                isLoading: false,
                error: true
              });
            }),
            startWith({
              task: undefined,
              isLoading: true,
              error: false
            })
          );
        } else {
          return of({
            task: undefined,
            isLoading: false,
            error: true
          });
        }
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }
}