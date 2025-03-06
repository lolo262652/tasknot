import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useHistoryStore } from '../store/historyStore';
import { Clock, User, FileText } from 'lucide-react';

export default function History() {
  const { history, isLoading, fetchHistory, subscribeToHistory } = useHistoryStore();
  
  useEffect(() => {
    fetchHistory();
    const unsubscribe = subscribeToHistory();
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
  };
  
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'a créé';
      case 'updated':
        return 'a modifié';
      case 'status_changed':
        return 'a changé le statut de';
      default:
        return action;
    }
  };
  
  const getStatusLabel = (status: string | null) => {
    if (!status) return '';
    
    switch (status) {
      case 'todo':
        return 'À faire';
      case 'in-progress':
        return 'En cours';
      case 'done':
        return 'Fait';
      case 'deleted':
        return 'Supprimé';
      default:
        return status;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Historique des actions</h2>
      
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {history.length > 0 ? (
            history.map((item) => (
              <li key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="p-2 bg-indigo-100 rounded-full dark:bg-indigo-900">
                      <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-medium">{item.user_name || 'Utilisateur'}</span>{' '}
                      {getActionLabel(item.action)}{' '}
                      <span className="font-medium">"{item.task_title || 'Tâche'}"</span>
                      
                      {item.previous_status && item.new_status && (
                        <span>
                          {' '}de <span className="font-medium">{getStatusLabel(item.previous_status)}</span>{' '}
                          à <span className="font-medium">{getStatusLabel(item.new_status)}</span>
                        </span>
                      )}
                    </p>
                    
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="p-8 text-center text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg">Aucun historique disponible</p>
              <p className="text-sm mt-1">Les actions sur les tâches apparaîtront ici</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}