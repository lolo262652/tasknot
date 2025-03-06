import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, Bell } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Header({ toggleSidebar, isDarkMode, toggleDarkMode }: HeaderProps) {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Tableau de Bord');
  
  useEffect(() => {
    switch (location.pathname) {
      case '/':
        setPageTitle('Tableau de Bord');
        break;
      case '/my-tasks':
        setPageTitle('Mes Tâches');
        break;
      case '/teams':
        setPageTitle('Équipes');
        break;
      case '/history':
        setPageTitle('Historique');
        break;
      case '/settings':
        setPageTitle('Paramètres');
        break;
      default:
        setPageTitle('TaskFlow');
    }
  }, [location]);
  
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-2 text-gray-600 rounded-md lg:hidden hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 text-gray-600 rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <button
          className="p-2 text-gray-600 rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}