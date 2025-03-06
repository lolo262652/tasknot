import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

export interface TaskDocument {
  id: string;
  task_id: string;
  name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  uploaded_by: string;
  created_at: string;
}

interface DocumentState {
  documentsByTask: Record<string, TaskDocument[]>;
  isLoading: boolean;
  fetchDocuments: (taskId: string) => Promise<void>;
  uploadDocument: (taskId: string, file: File, userId: string) => Promise<void>;
  deleteDocument: (documentId: string, taskId: string) => Promise<void>;
  downloadDocument: (document: TaskDocument) => Promise<void>;
  getDocumentUrl: (document: TaskDocument) => Promise<string | null>;
  subscribeToDocuments: (taskId: string) => () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documentsByTask: {},
  isLoading: false,

  fetchDocuments: async (taskId: string) => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase
        .from('task_documents')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set(state => ({ 
        documentsByTask: {
          ...state.documentsByTask,
          [taskId]: data || []
        },
        isLoading: false 
      }));
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.message || 'Erreur lors du chargement des documents');
    }
  },

  uploadDocument: async (taskId: string, file: File, userId: string) => {
    try {
      set({ isLoading: true });

      // Vérifier si le fichier existe déjà pour cette tâche
      const { data: existingDocs } = await supabase
        .from('task_documents')
        .select('name')
        .eq('task_id', taskId)
        .eq('name', file.name);

      if (existingDocs && existingDocs.length > 0) {
        throw new Error('Un document avec ce nom existe déjà pour cette tâche');
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `task-documents/${taskId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record in database
      const { data, error: dbError } = await supabase
        .from('task_documents')
        .insert({
          task_id: taskId,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          content_type: file.type,
          uploaded_by: userId,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      set(state => ({ 
        documentsByTask: {
          ...state.documentsByTask,
          [taskId]: [data, ...(state.documentsByTask[taskId] || [])]
        },
        isLoading: false 
      }));

      toast.success('Document téléchargé avec succès !');
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.message || 'Erreur lors du téléchargement du document');
    }
  },

  deleteDocument: async (documentId: string, taskId: string) => {
    try {
      const documents = get().documentsByTask[taskId] || [];
      const document = documents.find(d => d.id === documentId);
      if (!document) throw new Error('Document non trouvé');

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete record from database
      const { error: dbError } = await supabase
        .from('task_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      set(state => ({
        documentsByTask: {
          ...state.documentsByTask,
          [taskId]: state.documentsByTask[taskId]?.filter(d => d.id !== documentId) || []
        }
      }));

      toast.success('Document supprimé avec succès !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression du document');
    }
  },

  downloadDocument: async (document: TaskDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create a download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du téléchargement du document');
    }
  },

  getDocumentUrl: async (document: TaskDocument) => {
    try {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600); // URL valide pendant 1 heure

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Erreur lors de la création de l\'URL du document:', error);
      return null;
    }
  },

  subscribeToDocuments: (taskId: string) => {
    // Subscribe to all changes on task_documents table for this specific task
    const documentsSubscription = supabase
      .channel(`task-documents-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_documents',
          filter: `task_id=eq.${taskId}`
        },
        async (payload) => {
          console.log('Realtime document change received:', payload);
          const { eventType } = payload;

          switch (eventType) {
            case 'INSERT':
              const newDoc = payload.new as TaskDocument;
              set((state) => ({
                documentsByTask: {
                  ...state.documentsByTask,
                  [taskId]: [newDoc, ...(state.documentsByTask[taskId] || [])]
                }
              }));
              break;

            case 'DELETE':
              const deletedDoc = payload.old as TaskDocument;
              set((state) => ({
                documentsByTask: {
                  ...state.documentsByTask,
                  [taskId]: state.documentsByTask[taskId]?.filter(
                    (doc) => doc.id !== deletedDoc.id
                  ) || []
                }
              }));
              break;
          }
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      documentsSubscription.unsubscribe();
    };
  },
}));
