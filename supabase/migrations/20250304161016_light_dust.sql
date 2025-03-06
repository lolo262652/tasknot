/*
  # TaskFlow Database Schema

  1. New Tables
    - `profiles` - User profiles linked to auth.users
    - `tasks` - Task management with status tracking
    - `task_history` - History of task changes and actions
    - `task_documents` - Documents attached to tasks
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
  
  3. Functions & Triggers
    - User creation handler
    - Updated timestamp handlers
*/

-- Check if tables exist and create them if they don't
DO $$ 
BEGIN
  -- Create profiles table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
      email TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Create tasks table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
    CREATE TABLE tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      due_date TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'todo',
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Create task_documents table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_documents') THEN
    CREATE TABLE task_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      content_type TEXT NOT NULL,
      uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    
    ALTER TABLE task_documents ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Create task history table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_history') THEN
    CREATE TABLE task_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    
    ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Create policies if they don't exist
DO $$ 
BEGIN
  -- Profiles policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can view all profiles'
  ) THEN
    CREATE POLICY "Users can view all profiles"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Tasks policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Users can view their own tasks'
  ) THEN
    CREATE POLICY "Users can view their own tasks"
      ON tasks
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id OR auth.uid() = assigned_to);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Users can insert their own tasks'
  ) THEN
    CREATE POLICY "Users can insert their own tasks"
      ON tasks
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Users can update their own tasks'
  ) THEN
    CREATE POLICY "Users can update their own tasks"
      ON tasks
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id OR auth.uid() = assigned_to);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Users can delete their own tasks'
  ) THEN
    CREATE POLICY "Users can delete their own tasks"
      ON tasks
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Task documents policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'task_documents' 
    AND policyname = 'Users can view documents of their tasks'
  ) THEN
    CREATE POLICY "Users can view documents of their tasks"
      ON task_documents
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = task_documents.task_id 
        AND (tasks.user_id = auth.uid() OR tasks.assigned_to = auth.uid())
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'task_documents' 
    AND policyname = 'Users can upload documents to their tasks'
  ) THEN
    CREATE POLICY "Users can upload documents to their tasks"
      ON task_documents
      FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = task_documents.task_id 
        AND (tasks.user_id = auth.uid() OR tasks.assigned_to = auth.uid())
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'task_documents' 
    AND policyname = 'Users can delete documents from their tasks'
  ) THEN
    CREATE POLICY "Users can delete documents from their tasks"
      ON task_documents
      FOR DELETE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = task_documents.task_id 
        AND tasks.user_id = auth.uid()
      ));
  END IF;

  -- Task history policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'task_history' 
    AND policyname = 'Users can view history of their tasks'
  ) THEN
    CREATE POLICY "Users can view history of their tasks"
      ON task_history
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = task_history.task_id 
        AND (tasks.user_id = auth.uid() OR tasks.assigned_to = auth.uid())
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'task_history' 
    AND policyname = 'Users can insert history for their tasks'
  ) THEN
    CREATE POLICY "Users can insert history for their tasks"
      ON task_history
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Create functions and triggers
-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_tasks_updated_at'
  ) THEN
    CREATE TRIGGER handle_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'handle_profiles_updated_at'
  ) THEN
    CREATE TRIGGER handle_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;