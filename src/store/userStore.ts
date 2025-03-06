import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface UserState {
  users: Profile[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      
      set({ users: data || [], isLoading: false });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Erreur lors du chargement des utilisateurs',
        users: [] 
      });
      toast.error(error.message || 'Erreur lors du chargement des utilisateurs');
    }
  },
}));
