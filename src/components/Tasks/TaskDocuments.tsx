import React, { useEffect, useRef, useState } from 'react';
import { useDocumentStore, TaskDocument } from '../../store/documentStore';
import { useAuthStore } from '../../store/authStore';
import { FileUp, Download, Trash2, File, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PDFPreview from './PDFPreview';

interface TaskDocumentsProps {
  taskId: string;
}

export default function TaskDocuments({ taskId }: TaskDocumentsProps) {
  const { user } = useAuthStore();
  const { documentsByTask, isLoading, fetchDocuments, uploadDocument, deleteDocument, downloadDocument, getDocumentUrl } = useDocumentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDocument, setPreviewDocument] = useState<TaskDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const documents = documentsByTask[taskId] || [];

  useEffect(() => {
    fetchDocuments(taskId);
  }, [taskId, fetchDocuments]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      await uploadDocument(taskId, file, user.id);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePreview = async (document: TaskDocument) => {
    const url = await getDocumentUrl(document);
    if (url) {
      setPreviewUrl(url);
      setPreviewDocument(document);
    } else {
      // toast.error('Impossible de prévisualiser le document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Documents</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
        >
          <FileUp className="w-4 h-4 mr-2" />
          Ajouter un document
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Aucun document attaché à cette tâche
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow dark:bg-gray-800"
            >
              <div className="flex items-center space-x-3">
                <File className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{document.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(document.file_size)} • {format(new Date(document.created_at), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePreview(document)}
                  className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => downloadDocument(document)}
                  className="p-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteDocument(document.id, taskId)}
                  className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewDocument && previewUrl && (
        <PDFPreview
          url={previewUrl}
          onClose={() => {
            setPreviewDocument(null);
            setPreviewUrl(null);
          }}
        />
      )}
    </div>
  );
}
