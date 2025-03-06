import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AuthForm from '../components/Auth/AuthForm';
import { CheckSquare } from 'lucide-react';

export default function Auth() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <CheckSquare className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 ml-2">TaskFlow</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 max-w-md">
          Gérez efficacement vos tâches avec notre système de colonnes interactives
        </p>
      </div>
      
      <AuthForm />
      
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>TaskFlow - Application de gestion de tâches</p>
        <p className="mt-1"> 2025 Tous droits réservés</p>
      </div>
    </div>
  );
}