import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'deleted';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  status: TaskStatus;
  user_id: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  permanentlyDeleteTask: (id: string) => Promise<void>;
  subscribeToTasks: () => (() => void);
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  
  fetchTasks: async () => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ tasks: data || [], isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.message || 'Erreur lors du chargement des tâches');
    }
  },
  
  addTask: async (task) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();
      
      if (error) throw error;
      
      // Ne plus mettre à jour l'état ici car il sera mis à jour par l'événement Realtime
      
      // Add to history
      await supabase
        .from('task_history')
        .insert({
          task_id: data.id,
          user_id: task.user_id,
          action: 'created',
          new_status: task.status,
        });
      
      toast.success('Tâche ajoutée avec succès !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'ajout de la tâche');
    }
  },
  
  updateTask: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set({
        tasks: get().tasks.map((task) => (task.id === id ? data : task)),
      });
      
      // Add to history if status changed
      if (updates.status) {
        const oldTask = get().tasks.find(task => task.id === id);
        
        await supabase
          .from('task_history')
          .insert({
            task_id: id,
            user_id: data.user_id,
            action: 'updated',
            previous_status: oldTask?.status,
            new_status: updates.status,
          });
      }
      
      toast.success('Tâche mise à jour avec succès !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour de la tâche');
    }
  },
  
  updateTaskStatus: async (id, status) => {
    try {
      const task = get().tasks.find(t => t.id === id);
      if (!task) throw new Error('Tâche non trouvée');
      
      const previousStatus = task.status;
      
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set({
        tasks: get().tasks.map((task) => (task.id === id ? data : task)),
      });
      
      // Add to history
      await supabase
        .from('task_history')
        .insert({
          task_id: id,
          user_id: task.user_id,
          action: 'status_changed',
          previous_status: previousStatus,
          new_status: status,
        });
      
      toast.success(`Tâche déplacée vers ${status === 'todo' ? 'À faire' : 
        status === 'in-progress' ? 'En cours' : 
        status === 'done' ? 'Fait' : 'Supprimé'}`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de statut');
    }
  },
  
  deleteTask: async (id) => {
    // This just moves to "deleted" status
    return get().updateTaskStatus(id, 'deleted');
  },
  
  permanentlyDeleteTask: async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set({
        tasks: get().tasks.filter((task) => task.id !== id),
      });
      
      toast.success('Tâche supprimée définitivement');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression définitive');
    }
  },
  
  subscribeToTasks: () => {
    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        async (payload) => {
          const { eventType } = payload;

          switch (eventType) {
            case 'INSERT':
              const newTask = payload.new as Task;
              // Vérifier si la tâche n'existe pas déjà
              if (!get().tasks.some(task => task.id === newTask.id)) {
                set((state) => ({
                  tasks: [newTask, ...state.tasks]
                }));
                // Émettre un événement personnalisé pour la notification
                const event = new CustomEvent('newTaskAssigned', { detail: newTask });
                window.dispatchEvent(event);
              }
              break;

            case 'UPDATE':
              const updatedTask = payload.new as Task;
              const oldTask = payload.old as Task;
              
              set((state) => ({
                tasks: state.tasks.map((task) =>
                  task.id === updatedTask.id ? updatedTask : task
                )
              }));

              // Si l'assignation a changé, émettre un événement
              if (updatedTask.assigned_to !== oldTask.assigned_to) {
                const event = new CustomEvent('newTaskAssigned', { detail: updatedTask });
                window.dispatchEvent(event);
              }
              break;

            case 'DELETE':
              const deletedTask = payload.old as Task;
              set((state) => ({
                tasks: state.tasks.filter((task) => task.id !== deletedTask.id)
              }));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      tasksSubscription.unsubscribe();
    };
  },
}));