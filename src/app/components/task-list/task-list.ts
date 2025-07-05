import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest, Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { Task } from '../../interfaces/Task';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss'
})
export class TaskList implements OnInit, OnDestroy {
  tasks$: Observable<Task[]>;

  searchControl = new FormControl('');
  statusFilterControl = new FormControl<'all' | 'pending' | 'completed'>('all');
  hasDescriptionControl = new FormControl<'all' | 'true' | 'false'>('all');
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);

  sortByControl = new FormControl<'createdAt' | 'title'>('createdAt');
  sortDirectionControl = new FormControl<'asc' | 'desc'>('desc');

  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.tasks$ = this.taskService.getTasks();
  }

  ngOnInit(): void {
    this.searchControl.setValue(this.taskService.currentSearchText, { emitEvent: false });
    this.statusFilterControl.setValue(this.taskService.currentStatusFilter, { emitEvent: false });
    this.hasDescriptionControl.setValue(this.taskService.currentHasDescriptionFilter, { emitEvent: false });
    this.startDateControl.setValue(this.taskService.currentStartDateFilter ? new Date(this.taskService.currentStartDateFilter) : null, { emitEvent: false });
    this.endDateControl.setValue(this.taskService.currentEndDateFilter ? new Date(this.taskService.currentEndDateFilter) : null, { emitEvent: false });
    this.sortByControl.setValue(this.taskService.currentSortBy, { emitEvent: false });
    this.sortDirectionControl.setValue(this.taskService.currentSortDirection, { emitEvent: false });


    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(text => {
      this.taskService.setSearchText(text || '');
    });

    this.statusFilterControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(status => {
      this.taskService.setStatusFilter(status || 'all');
    });

    this.hasDescriptionControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.taskService.setHasDescriptionFilter(value || 'all');
    });

    combineLatest([
      this.startDateControl.valueChanges,
      this.endDateControl.valueChanges
    ]).pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(([startDate, endDate]) => {
      this.taskService.setDateFilter(startDate, endDate);
    });


    this.sortByControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(field => {
      this.taskService.setSortBy(field || 'createdAt');
    });

    this.sortDirectionControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(direction => {
      this.taskService.setSortDirection(direction || 'desc');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openAddTaskForm(): void {
    this.router.navigate(['/tasks/add']);
  }

  viewTaskDetails(id: string): void {
    this.router.navigate(['/tasks', id]);
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const success = await this.taskService.deleteTask(id).toPromise();
      if (success) {
        this.snackBar.open('Задача успешно удалена!', 'Закрыть', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      } else {
        this.snackBar.open('Не удалось удалить задачу.', 'Закрыть', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      }
    } catch (error) {
      this.snackBar.open('Произошла ошибка при удалении задачи.', 'Закрыть', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }
  }

  async toggleTaskStatus(task: Task): Promise<void> {
    const updatedTask: Task = {
      ...task,
      status: task.status === 'pending' ? 'completed' : 'pending'
    };
    try {
      await this.taskService.updateTask(updatedTask).toPromise();
      this.snackBar.open('Статус задачи обновлен!', 'Закрыть', {
        duration: 2000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    } catch (error) {
      this.snackBar.open('Не удалось обновить статус задачи.', 'Закрыть', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }
  }

  resetFilters(): void {
    this.searchControl.setValue('');
    this.statusFilterControl.setValue('all');
    this.hasDescriptionControl.setValue('all');
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
    this.sortByControl.setValue('createdAt');
    this.sortDirectionControl.setValue('desc');
  }
}