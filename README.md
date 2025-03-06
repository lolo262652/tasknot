# TaskNot - Système de Gestion de Tâches

TaskNot est une application moderne de gestion de tâches développée avec React, TypeScript et Supabase. Elle offre une interface intuitive de type Kanban avec des fonctionnalités avancées de gestion documentaire et de notifications en temps réel.

## Fonctionnalités Principales

### 🎯 Gestion des Tâches
- Interface Kanban avec colonnes (Todo, In Progress, Done, Deleted)
- Glisser-déposer pour changer le statut des tâches
- Assignation de tâches aux utilisateurs
- Système de priorités (Haute, Moyenne, Basse)

### 📄 Gestion Documentaire
- Support des documents PDF
- Stockage sécurisé dans Supabase Storage
- Organisation par tâche : `task-documents/{task_id}/{filename}`
- Contrôle d'accès basé sur les rôles

### 🔔 Notifications
- Notifications en temps réel pour les nouvelles tâches
- Retour sonore et visuel
- Notifications personnalisées par utilisateur
- Toast notifications avec détails de la tâche

### 🔒 Sécurité
- Authentification utilisateur via Supabase
- Politiques RLS (Row Level Security)
- Accès contrôlé aux documents
- Gestion sécurisée des sessions

## Technologies Utilisées

- ⚛️ React + TypeScript
- 🎨 Tailwind CSS
- 🔥 Vite
- 🗃️ Supabase (Base de données + Authentification + Storage)
- 🔄 Zustand (Gestion d'état)
- 🎯 React DnD Kit (Drag and Drop)
- 🔔 React Toastify (Notifications)

## Installation

1. Clonez le repository :
```bash
git clone https://github.com/lolo262652/tasknot.git
cd tasknot
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
Créez un fichier `.env` à la racine du projet avec :
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

4. Lancez l'application en mode développement :
```bash
npm run dev
```

## Structure du Projet

```
src/
├── components/         # Composants React
│   ├── Tasks/         # Composants liés aux tâches
│   └── Notifications/ # Système de notifications
├── store/             # Gestion d'état Zustand
├── lib/              # Configuration Supabase
├── hooks/            # Hooks personnalisés
└── pages/            # Pages de l'application

supabase/
└── migrations/       # Migrations de la base de données
```

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## Licence
git add .
git commit -m "Description des changements"
git push
MIT
