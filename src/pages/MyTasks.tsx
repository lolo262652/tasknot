import React, { useState, useEffect, useCallback } from 'react';
import { Task, useTaskStore } from '../store/taskStore';
import TaskCard from '../components/Tasks/TaskCard';
import TaskForm from '../components/Tasks/TaskForm';
import { Search, Plus, Filter } from 'lucide-react';
import debounce from 'lodash/debounce';

export default function MyTasks() {
  const { tasks, updateTask, deleteTask } = useTaskStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce search term updates
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
    }, 300),
    []
  );
  
  // Update debounced search term
  useEffect(() => {
    debouncedSetSearch(searchTerm);
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [searchTerm, debouncedSetSearch]);
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Exclude deleted tasks
    if (task.status === 'deleted' && statusFilter !== 'deleted') return false;
    
    // Apply status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    
    // Apply priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    
    // Apply search term
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descriptionMatch = task.description?.toLowerCase().includes(searchLower) || false;
      return titleMatch || descriptionMatch;
    }
    
    return true;
  });
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };
  
  const handleDeleteTask = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      deleteTask(id);
    }
  };
  
  const handleSubmitTask = (taskData: any) => {
    updateTask(editingTask!.id, taskData);
    setIsFormOpen(false);
    setEditingTask(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Rechercher dans le titre ou la description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <Filter className="w-5 h-5 inline-block mr-1" />
            Filtres
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Tous</option>
              <option value="todo">À faire</option>
              <option value="in-progress">En cours</option>
              <option value="done">Fait</option>
              <option value="deleted">Supprimé</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Priorité
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Toutes</option>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        ))}
        
        {filteredTasks.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg">Aucune tâche trouvée</p>
            <p className="text-sm mt-2">Ajustez vos filtres ou créez une nouvelle tâche</p>
          </div>
        )}
      </div>
      
      {isFormOpen && (
        <TaskForm
          task={editingTask || undefined}
          onSubmit={handleSubmitTask}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}