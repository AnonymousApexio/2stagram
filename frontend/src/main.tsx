import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/variables.css';
import './styles/reset.css';

const ROOT_ELEMENT = document.getElementById('root');
if (!ROOT_ELEMENT) throw new Error('Point de montage React introuvable.');

// Temporary mount point, replaced when the first approved page is implemented.
createRoot(ROOT_ELEMENT).render(
  <StrictMode>
    <main>
      <h1>2stagram</h1>
    </main>
  </StrictMode>,
);
