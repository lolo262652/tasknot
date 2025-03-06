import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  
  signUp: async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      
      // Auto sign in after signup for better UX
      if (data.user) {
        set({ user: data.user });
        await get().fetchProfile();
        toast.success('Inscription réussie ! Bienvenue sur TaskFlow.');
      } else {
        toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Erreur lors de l\'inscription');
      throw error;
    }
  },
  
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ user: data.user });
      await get().fetchProfile();
      toast.success('Connexion réussie !');
      window.location.href = '/'; // Redirection vers le tableau de bord
    } catch (error: any) {
      console.error('Signin error:', error);
      toast.error(error.message || 'Erreur lors de la connexion');
      throw error;
    }
  },
  
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ user: null, profile: null });
      toast.info('Déconnexion réussie');
      window.location.href = '/auth'; // Redirection vers la page d'authentification
    } catch (error: any) {
      console.error('Signout error:', error);
      toast.error(error.message || 'Erreur lors de la déconnexion');
    }
  },
  
  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      
      set({ profile: data, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      console.error('Error fetching profile:', error);
      toast.error(error.message || 'Erreur lors du chargement du profil');
    }
  },
}));

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session);
  const authStore = useAuthStore.getState();
  
  if (session?.user) {
    useAuthStore.setState({ user: session.user });
    authStore.fetchProfile();
  } else {
    useAuthStore.setState({ user: null, profile: null, isLoading: false });
    if (window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
  }
});

// Check for existing session on load
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    useAuthStore.setState({ user: session.user });
    useAuthStore.getState().fetchProfile();
  } else {
    useAuthStore.setState({ isLoading: false });
    if (window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
  }
});