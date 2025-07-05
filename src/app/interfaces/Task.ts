export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  description?: string;
  createdAt: number;
}