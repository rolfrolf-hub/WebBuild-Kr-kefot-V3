import React from 'react';
import ReactDOM from 'react-dom/client';
import { PreviewWindow } from './components/PreviewWindow';
import './preview.css';
import './style.css';

ReactDOM.createRoot(document.getElementById('preview-root')!).render(
    <React.StrictMode>
        <PreviewWindow />
    </React.StrictMode>
);
