import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Task, TaskStatus, useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { useNotifications } from '../hooks/useNotifications.tsx';
import TaskColumn from '../components/Tasks/TaskColumn';
import TaskForm from '../components/Tasks/TaskForm';
import NotificationSound from '../components/Notifications/NotificationSound';

export default function Dashboard() {
  const { tasks, isLoading, fetchTasks, addTask, updateTask, updateTaskStatus, deleteTask, permanentlyDeleteTask, subscribeToTasks } = useTaskStore();
  const { user } = useAuthStore();
  const { lastTask, notifyNewTask } = useNotifications();
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  useEffect(() => {
    fetchTasks();
    const unsubscribe = subscribeToTasks();
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeTaskId = active.id as string;
    const foundTask = tasks.find(task => task.id === activeTaskId);
    
    if (foundTask) {
      setActiveTask(foundTask);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const newStatus = over.id as TaskStatus;
      updateTaskStatus(active.id as string, newStatus);
    }
    
    setActiveTask(null);
  };
  
  const handleAddTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };
  
  const handleDeleteTask = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      deleteTask(id);
    }
  };
  
  const handlePermanentlyDeleteTask = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cette tâche ? Cette action est irréversible.')) {
      permanentlyDeleteTask(id);
    }
  };
  
  const handleSubmitTask = (taskData: any) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask({
        ...taskData,
        status: 'todo',
      });
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };
  
  // Filter tasks by status
  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const doneTasks = tasks.filter(task => task.status === 'done');
  const deletedTasks = tasks.filter(task => task.status === 'deleted');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="h-full">
      {/* Composant de notification sonore */}
      <NotificationSound newTask={lastTask} />
      
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-8rem)]">
          <TaskColumn
            id="todo"
            title="À faire"
            tasks={todoTasks}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
          
          <TaskColumn
            id="in-progress"
            title="En cours"
            tasks={inProgressTasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
          
          <TaskColumn
            id="done"
            title="Fait"
            tasks={doneTasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
          
          <TaskColumn
            id="deleted"
            title="Supprimé"
            tasks={deletedTasks}
            onEditTask={handleEditTask}
            onDeleteTask={handlePermanentlyDeleteTask}
          />
        </div>
      </DndContext>
      
      {isFormOpen && (
        <TaskForm
          task={editingTask || undefined}
          onSubmit={handleSubmitTask}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}