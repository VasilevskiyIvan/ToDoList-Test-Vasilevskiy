import { Task } from "./Task";

export interface ITaskDetail {
  task: Task | undefined;
  isLoading: boolean;
  error: boolean;
}