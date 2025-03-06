import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Task, TaskPriority } from '../../store/taskStore';
import { useUserStore } from '../../store/userStore';
import TaskDocuments from './TaskDocuments';
import { 
  Clock, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  ArrowUpCircle,
  User
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { users, fetchUsers } = useUserStore();
  
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const assignedUser = users.find(user => user.id === task.assigned_to);

  const priorityColors: Record<TaskPriority, string> = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  
  const priorityLabels: Record<TaskPriority, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  };
  
  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date() && task.status !== 'done';
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{task.title}</h3>
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          {task.description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2 mt-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority as TaskPriority]}`}>
          <ArrowUpCircle className="w-3 h-3 inline mr-1" />
          {priorityLabels[task.priority as TaskPriority]}
        </span>
        
        {task.due_date && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            isOverdue(task.due_date) 
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {formatDate(task.due_date)}
            {isOverdue(task.due_date) && (
              <AlertTriangle className="w-3 h-3 inline ml-1 text-red-600 dark:text-red-400" />
            )}
          </span>
        )}
        
        {task.assigned_to && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
            <User className="w-3 h-3 inline mr-1" />
            {assignedUser ? (assignedUser.full_name || assignedUser.email) : 'Assignée'}
          </span>
        )}
      </div>

      <TaskDocuments taskId={task.id} />
    </div>
  );
}