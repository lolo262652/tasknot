import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export interface TaskHistory {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
  // Joined data
  task_title?: string;
  user_name?: string;
}

interface HistoryState {
  history: TaskHistory[];
  isLoading: boolean;
  fetchHistory: () => Promise<void>;
  subscribeToHistory: () => (() => void);
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],
  isLoading: false,
  
  fetchHistory: async () => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase
        .from('task_history')
        .select(`
          *,
          tasks:task_id (title),
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Transform the data to flatten the structure
      const formattedHistory = data.map(item => ({
        ...item,
        task_title: item.tasks?.title,
        user_name: item.profiles?.full_name,
      }));
      
      set({ history: formattedHistory, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.message || 'Erreur lors du chargement de l\'historique');
    }
  },
  
  subscribeToHistory: () => {
    const subscription = supabase
      .channel('history-channel')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'task_history' 
        }, 
        (payload) => {
          get().fetchHistory();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  },
}));