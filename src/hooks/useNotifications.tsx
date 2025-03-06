import React from 'react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Task } from '../store/taskStore';
import { toast } from 'react-toastify';

export function useNotifications() {
  const [lastTask, setLastTask] = useState<Task | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const handleNewTask = (event: CustomEvent<Task>) => {
      const task = event.detail;
      
      // Ne notifier que si la tâche est assignée à l'utilisateur connecté
      if (user && task.assigned_to === user.id) {
        toast.info(
          <div>
            <h4 className="font-semibold">Nouvelle tâche assignée</h4>
            <p>{task.title}</p>
            <p className="text-sm text-gray-500">
              Priorité : {
                task.priority === 'high' ? '🔴 Haute' :
                task.priority === 'medium' ? '🟡 Moyenne' :
                '🟢 Basse'
              }
            </p>
          </div>,
          {
            position: "top-right",
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            icon: '📋'
          }
        );
        setLastTask(task);
      }
    };

    // Écouter l'événement personnalisé
    window.addEventListener('newTaskAssigned', handleNewTask as EventListener);

    return () => {
      window.removeEventListener('newTaskAssigned', handleNewTask as EventListener);
    };
  }, [user]);

  return {
    lastTask,
    notifyNewTask: (task: Task) => {
      const event = new CustomEvent('newTaskAssigned', { detail: task });
      window.dispatchEvent(event);
    }
  };
}
