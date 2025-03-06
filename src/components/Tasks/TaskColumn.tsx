import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../store/taskStore';
import SortableTaskCard from './SortableTaskCard';
import { Plus } from 'lucide-react';

interface TaskColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onAddTask?: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskColumn({
  id,
  title,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });
  
  const columnColors: Record<TaskStatus, string> = {
    'todo': 'bg-blue-50 dark:bg-blue-900/20',
    'in-progress': 'bg-yellow-50 dark:bg-yellow-900/20',
    'done': 'bg-green-50 dark:bg-green-900/20',
    'deleted': 'bg-red-50 dark:bg-red-900/20',
  };
  
  const headerColors: Record<TaskStatus, string> = {
    'todo': 'bg-blue-500 dark:bg-blue-700',
    'in-progress': 'bg-yellow-500 dark:bg-yellow-700',
    'done': 'bg-green-500 dark:bg-green-700',
    'deleted': 'bg-red-500 dark:bg-red-700',
  };
  
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full rounded-lg shadow ${
        columnColors[id]
      } ${isOver ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''}`}
    >
      <div className={`p-3 rounded-t-lg ${headerColors[id]} text-white flex justify-between items-center`}>
        <h2 className="font-semibold">{title}</h2>
        <span className="px-2 py-0.5 bg-white bg-opacity-30 rounded-full text-sm">
          {tasks.length}
        </span>
        
        {id === 'todo' && onAddTask && (
          <button
            onClick={onAddTask}
            className="p-1 ml-2 text-white bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="flex-1 p-2 overflow-y-auto">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                id={task.id}
                task={task}
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
            
            {tasks.length === 0 && (
              <div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
                Aucune tâche
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}