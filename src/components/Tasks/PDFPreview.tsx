import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configuration du worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.js';

interface PDFPreviewProps {
  url: string;
  onClose: () => void;
}

export default function PDFPreview({ url, onClose }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    setLoading(false);
    setError("Impossible de charger le PDF. Veuillez réessayer.");
    console.error('Erreur de chargement du PDF:', error);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl p-4 mx-4 bg-white rounded-lg dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mt-8">
          {loading && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {error ? (
            <div className="text-center text-red-500 dark:text-red-400 p-4">
              {error}
            </div>
          ) : (
            <>
              <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex justify-center my-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                }
              >
                <Page 
                  pageNumber={pageNumber} 
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="flex justify-center"
                  width={Math.min(window.innerWidth * 0.8, 800)}
                  loading={
                    <div className="flex justify-center my-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  }
                />
              </Document>

              {numPages > 0 && (
                <div className="flex items-center justify-center gap-4 mt-4 pb-4">
                  <button
                    onClick={() => setPageNumber(page => Math.max(1, page - 1))}
                    disabled={pageNumber <= 1}
                    className="flex items-center px-3 py-1 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Page {pageNumber} sur {numPages}
                  </span>
                  <button
                    onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
                    disabled={pageNumber >= numPages}
                    className="flex items-center px-3 py-1 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
