export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  position?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  _id: string;
  title: string;
  description: string;
  assignedTo: string | IUser;
  assignedBy: string | IUser;
  group?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  startDate?: Date;
  completedDate?: Date;
  tags?: string[];
  attachments?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IReport {
  _id: string;
  task: string | ITask;
  user: string | IUser;
  title: string;
  content: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedDate?: Date;
  reviewedBy?: string | IUser;
  reviewedDate?: Date;
  comments?: string;
  attachments?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  _id: string;
  task: string | ITask;
  user: string | IUser;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id: string;
  user: string | IUser;
  type: 'task_assigned' | 'task_updated' | 'report_submitted' | 'report_reviewed';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}
