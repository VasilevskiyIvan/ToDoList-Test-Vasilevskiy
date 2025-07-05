import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  CollectionReference,
  QuerySnapshot,
  DocumentSnapshot,
  DocumentData,
  FirestoreError,
  Unsubscribe
} from '@angular/fire/firestore';
import { Observable, from, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, filter, first, catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Task } from '../interfaces/Task';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksCollectionRef: CollectionReference<DocumentData> | null = null;
  private unsubscribeFirestore: Unsubscribe | null = null;

  private _allTasks = new BehaviorSubject<Task[]>([]);
  private _searchText = new BehaviorSubject<string>('');
  private _statusFilter = new BehaviorSubject<'all' | 'pending' | 'completed'>('all');
  private _hasDescriptionFilter = new BehaviorSubject<'all' | 'true' | 'false'>('all');
  private _startDateFilter = new BehaviorSubject<number | null>(null);
  private _endDateFilter = new BehaviorSubject<number | null>(null);
  private _sortBy = new BehaviorSubject<'createdAt' | 'title'>('createdAt');
  private _sortDirection = new BehaviorSubject<'asc' | 'desc'>('desc');

  public readonly filteredAndSortedTasks$: Observable<Task[]>;

  constructor(private firestore: Firestore, private authService: AuthService) {
    this.authService.userId$.pipe(
      tap(() => {
        if (this.unsubscribeFirestore) {
          this.unsubscribeFirestore();
          this._allTasks.next([]);
        }
      }),
      switchMap(userId => {
        if (userId) {
          this.tasksCollectionRef = collection(this.firestore, `users/${userId}/tasks`);
          return new Observable<Task[]>(observer => {
            this.unsubscribeFirestore = onSnapshot(this.tasksCollectionRef!, (snapshot: QuerySnapshot<DocumentData>) => {
              const tasks: Task[] = [];
              snapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
                const data = doc.data() as Omit<Task, 'id'>;
                tasks.push({
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt || Date.now()
                } as Task);
              });
              this._allTasks.next(tasks);
              observer.next(tasks);
            }, (error: FirestoreError) => {
              observer.error(error);
            });
            return () => {
              if (this.unsubscribeFirestore) {
                this.unsubscribeFirestore();
                this.unsubscribeFirestore = null;
              }
            };
          });
        } else {
          this.tasksCollectionRef = null;
          this._allTasks.next([]);
          return of([]);
        }
      }),
      catchError(error => {
        return of([]);
      })
    ).subscribe();

    this.filteredAndSortedTasks$ = combineLatest([
      this._allTasks,
      this._searchText,
      this._statusFilter,
      this._hasDescriptionFilter,
      this._startDateFilter,
      this._endDateFilter,
      this._sortBy,
      this._sortDirection
    ]).pipe(
      map(([tasks, searchText, statusFilter, hasDescriptionFilter, startDate, endDate, sortBy, sortDirection]) => {
        let filteredTasks = [...tasks];

        if (searchText) {
          const lowerCaseSearchText = searchText.toLowerCase();
          filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(lowerCaseSearchText) ||
            (task.description && task.description.toLowerCase().includes(lowerCaseSearchText))
          );
        }

        if (statusFilter !== 'all') {
          filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
        }

        if (hasDescriptionFilter === 'true') {
          filteredTasks = filteredTasks.filter(task =>
            task.description && task.description.trim().length > 0
          );
        } else if (hasDescriptionFilter === 'false') {
          filteredTasks = filteredTasks.filter(task =>
            !task.description || task.description.trim().length === 0
          );
        }

        if (startDate) {
          filteredTasks = filteredTasks.filter(task => task.createdAt >= startDate);
        }
        if (endDate) {
          const endOfDay = endDate + (24 * 60 * 60 * 1000) - 1;
          filteredTasks = filteredTasks.filter(task => task.createdAt <= endOfDay);
        }

        filteredTasks.sort((a, b) => {
          let compareValue = 0;
          if (sortBy === 'createdAt') {
            compareValue = a.createdAt - b.createdAt;
          } else if (sortBy === 'title') {
            compareValue = a.title.localeCompare(b.title);
          }
          return sortDirection === 'asc' ? compareValue : -compareValue;
        });

        return filteredTasks;
      })
    );
  }

  private getCollectionRef(): Observable<CollectionReference<DocumentData>> {
    return this.authService.userId$.pipe(
      filter(userId => !!userId),
      map(() => this.tasksCollectionRef),
      filter((ref): ref is CollectionReference<DocumentData> => ref !== null),
      first()
    );
  }

  getTasks(): Observable<Task[]> {
    return this.filteredAndSortedTasks$;
  }

  getTaskById(id: string): Observable<Task | undefined> {
    return this.getCollectionRef().pipe(
      switchMap(collectionRef => {
        const docRef = doc(collectionRef, id);
        return from(getDoc(docRef)).pipe(
          map(snapshot => snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Task : undefined),
          catchError(() => of(undefined))
        );
      }),
      catchError(() => of(undefined))
    );
  }

  addTask(task: Omit<Task, 'id' | 'status' | 'createdAt'>): Observable<Task> {
    return this.getCollectionRef().pipe(
      switchMap(collectionRef => {
        const newTask = { ...task, status: 'pending', createdAt: Date.now() };
        return from(addDoc(collectionRef, newTask)).pipe(
          map(docRef => ({ id: docRef.id, ...newTask } as Task)),
          catchError(() => of())
        );
      }),
      catchError(() => of())
    );
  }

  deleteTask(id: string): Observable<boolean> {
    return this.getCollectionRef().pipe(
      switchMap(collectionRef => {
        const docRef = doc(collectionRef, id);
        return from(deleteDoc(docRef)).pipe(
          map(() => true),
          catchError(() => of(false))
        );
      }),
      catchError(() => of(false))
    );
  }

  updateTask(updatedTask: Task): Observable<Task | undefined> {
    return this.getCollectionRef().pipe(
      switchMap(collectionRef => {
        const docRef = doc(collectionRef, updatedTask.id);
        const { id, ...dataToUpdate } = updatedTask;
        return from(updateDoc(docRef, dataToUpdate)).pipe(
          map(() => updatedTask),
          catchError(() => of(undefined))
        );
      }),
      catchError(() => of(undefined))
    );
  }

  setSearchText(text: string): void {
    this._searchText.next(text);
  }

  setStatusFilter(status: 'all' | 'pending' | 'completed'): void {
    this._statusFilter.next(status);
  }

  setHasDescriptionFilter(value: 'all' | 'true' | 'false'): void {
    this._hasDescriptionFilter.next(value);
  }

  setDateFilter(startDate: Date | null, endDate: Date | null): void {
    this._startDateFilter.next(startDate ? startDate.getTime() : null);
    this._endDateFilter.next(endDate ? endDate.getTime() : null);
  }

  setSortBy(field: 'createdAt' | 'title'): void {
    this._sortBy.next(field);
  }

  setSortDirection(direction: 'asc' | 'desc'): void {
    this._sortDirection.next(direction);
  }

  get currentSearchText(): string {
    return this._searchText.getValue();
  }

  get currentStatusFilter(): 'all' | 'pending' | 'completed' {
    return this._statusFilter.getValue();
  }

  get currentHasDescriptionFilter(): 'all' | 'true' | 'false' {
    return this._hasDescriptionFilter.getValue();
  }

  get currentStartDateFilter(): number | null {
    return this._startDateFilter.getValue();
  }

  get currentEndDateFilter(): number | null {
    return this._endDateFilter.getValue();
  }

  get currentSortBy(): 'createdAt' | 'title' {
    return this._sortBy.getValue();
  }

  get currentSortDirection(): 'asc' | 'desc' {
    return this._sortDirection.getValue();
  }
}