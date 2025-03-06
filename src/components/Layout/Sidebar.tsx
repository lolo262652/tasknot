import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  Settings, 
  LogOut,
  Users
} from 'lucide-react';

export default function Sidebar() {
  const { signOut, profile } = useAuthStore();
  
  const navItems = [
    {
      name: 'Tableau de Bord',
      path: '/',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: 'Mes Tâches',
      path: '/my-tasks',
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      name: 'Historique',
      path: '/history',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      name: 'Paramètres',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];
  
  // Add Teams option if user is admin
  if (profile?.role === 'admin') {
    navItems.splice(2, 0, {
      name: 'Équipes',
      path: '/teams',
      icon: <Users className="w-5 h-5" />,
    });
  }
  
  return (
    <div className="flex flex-col h-full px-3 py-4 overflow-y-auto bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center mb-6 px-2">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">TaskFlow</h1>
      </div>
      
      <div className="flex flex-col justify-between flex-1">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-base font-medium rounded-md ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="mt-auto">
          {profile && (
            <div className="flex items-center px-4 py-3 mb-2 rounded-md bg-gray-50 dark:bg-gray-700">
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    className="w-8 h-8 rounded-full"
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 text-white bg-indigo-600 rounded-full">
                    {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {profile.full_name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {profile.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                </p>
              </div>
            </div>
          )}
          
          <button
            onClick={signOut}
            className="flex items-center w-full px-4 py-2 mt-1 text-base font-medium text-gray-600 rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}