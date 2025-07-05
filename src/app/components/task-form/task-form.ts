import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TaskService } from '../../services/task.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss'
})
export class TaskForm implements OnInit {
  taskForm!: FormGroup;

  constructor(
    private taskService: TaskService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.taskForm = new FormGroup({
      title: new FormControl('', Validators.required),
      description: new FormControl('')
    });
  }

  async onSubmit(): Promise<void> {
    if (this.taskForm.valid) {
      const { title, description } = this.taskForm.value;
      try {
        await this.taskService.addTask({ title, description }).toPromise();
        this.snackBar.open('Задача успешно добавлена!', 'Закрыть', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.router.navigate(['/tasks']);
      } catch (error) {
        this.snackBar.open('Произошла ошибка при добавлении задачи.', 'Закрыть', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      }
    } else {
      this.taskForm.markAllAsTouched();
    }
  }

  cancel(): void {
    this.router.navigate(['/tasks']);
  }
}