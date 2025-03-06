import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function copyWorker() {
    try {
        // Créer le dossier de destination s'il n'existe pas
        const destDir = join(__dirname, 'public', 'node_modules', 'pdfjs-dist', 'build');
        await fs.mkdir(destDir, { recursive: true });

        // Copier le worker
        const srcFile = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');
        const destFile = join(destDir, 'pdf.worker.min.js');

        await fs.copyFile(srcFile, destFile);
        console.log('PDF.js worker copié avec succès !');
    } catch (error) {
        console.error('Erreur lors de la copie du worker:', error);
    }
}

copyWorker();
