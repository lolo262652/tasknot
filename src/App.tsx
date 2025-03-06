import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuthStore } from './store/authStore';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import History from './pages/History';
import Settings from './pages/Settings';
import Auth from './pages/Auth';

function App() {
  const { user, isLoading } = useAuthStore();
  const [appReady, setAppReady] = useState(false);
  
  useEffect(() => {
    // Wait for auth state to be determined
    if (!isLoading) {
      setAppReady(true);
    }
  }, [isLoading]);
  
  if (!appReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const routes = [
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          element: <Dashboard />,
        },
        {
          path: 'my-tasks',
          element: <MyTasks />,
        },
        {
          path: 'history',
          element: <History />,
        },
        {
          path: 'settings',
          element: <Settings />,
        },
        {
          path: '*',
          element: <Navigate to="/" replace />,
        },
      ],
    },
  ];

  if (!user) {
    routes.push({
      path: '/auth',
      element: <Auth />,
    });
    routes.push({
      path: '*',
      element: <Navigate to="/auth" replace />,
    });
  }

  const router = createBrowserRouter(routes, {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  });

  return (
    <>
      <RouterProvider router={router} />
      
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;