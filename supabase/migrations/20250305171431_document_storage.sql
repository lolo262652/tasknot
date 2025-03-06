-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création du bucket documents s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
        INSERT INTO storage.buckets (id, name)
        VALUES ('documents', 'documents');
    END IF;
END $$;

-- Configuration du bucket documents
UPDATE storage.buckets
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf']::text[]
WHERE id = 'documents';

-- Create task_documents table
CREATE TABLE IF NOT EXISTS public.task_documents (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
    name text NOT NULL,
    file_path text NOT NULL,
    file_size integer NOT NULL,
    content_type text NOT NULL,
    uploaded_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(task_id, name)
);

-- Enable RLS
ALTER TABLE public.task_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view documents of tasks they have access to" ON public.task_documents;
DROP POLICY IF EXISTS "Users can insert documents to tasks they have access to" ON public.task_documents;
DROP POLICY IF EXISTS "Users can delete documents of tasks they have access to" ON public.task_documents;
DROP POLICY IF EXISTS "Users can read documents of tasks they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents to tasks they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents of tasks they have access to" ON storage.objects;

-- Create policies
CREATE POLICY "Users can view documents of tasks they have access to"
    ON public.task_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_documents.task_id
            AND (
                t.user_id = auth.uid() 
                OR 
                t.assigned_to = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert documents to tasks they have access to"
    ON public.task_documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_documents.task_id
            AND (
                t.user_id = auth.uid() 
                OR 
                t.assigned_to = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete documents of tasks they have access to"
    ON public.task_documents
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_documents.task_id
            AND (
                t.user_id = auth.uid() 
                OR 
                t.assigned_to = auth.uid()
            )
        )
    );

-- Storage policies
CREATE POLICY "Users can read documents of tasks they have access to"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM public.task_documents td
            JOIN public.tasks t ON t.id = td.task_id
            WHERE split_part(name, '/', 1) = 'task-documents'
            AND split_part(name, '/', 2) = t.id::text
            AND (
                t.user_id = auth.uid() 
                OR 
                t.assigned_to = auth.uid()
            )
        )
    );

CREATE POLICY "Users can upload documents to tasks they have access to"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND split_part(name, '/', 1) = 'task-documents'
        AND EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id::text = split_part(name, '/', 2)
            AND (
                t.user_id = auth.uid() 
                OR 
                t.assigned_to = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete documents of tasks they have access to"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM public.task_documents td
            JOIN public.tasks t ON t.id = td.task_id
            WHERE split_part(name, '/', 1) = 'task-documents'
            AND split_part(name, '/', 2) = t.id::text
            AND (
                t.user_id = auth.uid() 
                OR 
                t.assigned_to = auth.uid()
            )
        )
    );

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_document_deleted ON public.task_documents;
DROP FUNCTION IF EXISTS public.handle_deleted_document();

-- Trigger to delete files from storage when document record is deleted
CREATE OR REPLACE FUNCTION public.handle_deleted_document()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM storage.objects
    WHERE bucket_id = 'documents' AND name = OLD.file_path;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_document_deleted
    AFTER DELETE ON public.task_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_deleted_document();