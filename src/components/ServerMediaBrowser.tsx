import React, { useState, useEffect, useRef } from 'react';
import { BrandState } from '../types';
import { processImage } from '../utils/mediaProcessing';

interface ServerMediaBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    brandData: BrandState;
    onSelect: (url: string) => void;
}

interface ServerFile {
    name: string;
    url: string;
    type: 'image' | 'video' | 'audio' | 'zip' | 'misc';
    size: number;
    date: number;
}

export const ServerMediaBrowser: React.FC<ServerMediaBrowserProps> = ({
    isOpen,
    onClose,
    brandData,
    onSelect
}) => {
    const [files, setFiles] = useState<ServerFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'other'>('all');
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);
    const [pendingUploads, setPendingUploads] = useState<File[]>([]);
    const [seoName, setSeoName] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [deploying, setDeploying] = useState(false);
    const [deployStatus, setDeployStatus] = useState<'idle' | 'ok' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const deployPhp = async () => {
        setDeploying(true);
        setDeployStatus('idle');
        try {
            // Fetch the local media_manager.php via the Express API
            const phpRes = await fetch('http://localhost:3015/api/media-manager-php');
            if (!phpRes.ok) throw new Error('Could not load local media_manager.php');
            const phpBlob = await phpRes.blob();
            const phpFile = new File([phpBlob], 'media_manager.php', { type: 'application/x-php' });

            const formData = new FormData();
            formData.append('password', brandData.ftpPass || 'tryte-999-en-Roste-Draes');
            formData.append('action', 'deploy_php');
            formData.append('file', phpFile);

            const res = await fetch(`${brandData.serverBaseUrl}/media_manager.php?action=deploy_php`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Deploy failed');
            setDeployStatus('ok');
            setTimeout(() => setDeployStatus('idle'), 3000);
        } catch (e: any) {
            console.error('Deploy error:', e);
            setDeployStatus('error');
            setTimeout(() => setDeployStatus('idle'), 4000);
        } finally {
            setDeploying(false);
        }
    };

    const fetchFiles = async () => {
        setLoading(true);
        setError('');

        const password = brandData.ftpPass || "tryte-999-en-Roste-Draes";

        try {
            const response = await fetch(`${brandData.serverBaseUrl}/media_manager.php?action=list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Failed to load: ${response.status} ${errText}`);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                // If PHP returns an HTML error (like a Warning) it won't be valid JSON
                throw new Error(`Server returned non-JSON: ${text}`);
            }

            if (data.error) {
                throw new Error(data.error);
            }

            if (data.files) {
                setFiles(data.files);
            }

        } catch (err: any) {
            console.error("Media Browser Error:", err);
            setError(err.message || 'Failed to connect to server. Ensure media_manager.php is uploaded.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFile = async (e: React.MouseEvent, fileName: string) => {
        e.stopPropagation();

        if (!window.confirm('Are you sure you want to permanently delete this media from the server?')) {
            return;
        }

        setUploading(true); // Using uploading state to show loading indicator
        setError('');

        const password = brandData.ftpPass || "tryte-999-en-Roste-Draes";

        try {
            const formData = new FormData();
            formData.append('password', password);
            formData.append('action', 'delete');
            formData.append('filename', fileName);

            const response = await fetch(`${brandData.serverBaseUrl}/media_manager.php?action=delete`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Delete failed: ${response.status} ${errText}`);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Server returned non-JSON: ${text}`);
            }

            if (data.error) {
                throw new Error(data.error);
            }

            // Successfully deleted, refresh list
            await fetchFiles();

        } catch (err: any) {
            console.error("Delete Error:", err);
            setError(err.message || 'Failed to delete file.');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchFiles();
        }
    }, [isOpen]);

    const handleFileUpload = async (uploadFiles: File[]) => {
        if (!uploadFiles.length) return;

        // Start with a blank canvas to encourage the user to write a good SEO name
        setSeoName('');

        setPendingUploads(uploadFiles);
    };

    const handleAiSuggest = async () => {
        if (pendingUploads.length === 0) return;

        const storedKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
        if (!storedKey) {
            setShowApiKeyDialog(true);
            return;
        }

        setAiLoading(true);
        try {
            const file = pendingUploads[0];

            // Read file as base64
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result.split(',')[1]);
                    } else reject("Failed to read");
                };
                reader.onerror = error => reject(error);
            });

            const prompt = "You are an SEO expert for a Norwegian band called 'Kråkefot'. Look at this image and output exactly ONE short, highly descriptive, SEO-friendly filename that describes the scene/object using ONLY English or Norwegian lowercase letters, numbers, and hyphens. Do not include the file extension. Maximum 6 words.";

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${storedKey}`;
            console.log("AI SEO Request URL:", url.split('key=')[0] + "key=***");
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: file.type, data: base64Data } }
                        ]
                    }]
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error(`Invalid JSON response: ${response.status} ${response.statusText}`);
            }

            if (!response.ok) {
                throw new Error(data.error?.message || `API Error ${response.status}`);
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

            // Clean up the output to ensure it's a valid slug
            const cleanText = text.replace(/[^a-zA-Z0-9-æøåÆØÅ ]/g, '').replace(/\s+/g, '-').toLowerCase();
            if (cleanText) setSeoName(cleanText);

        } catch (error: any) {
            console.error("AI Naming error:", error);
            alert(`Failed to generate AI name: ${error?.message || error}`);
            if (String(error?.message || '').toLowerCase().includes('api key')) {
                localStorage.removeItem('gemini_api_key');
                setShowApiKeyDialog(true);
            }
        } finally {
            setAiLoading(false);
        }
    };

    const saveApiKey = () => {
        if (apiKeyInput.trim()) {
            localStorage.setItem('gemini_api_key', apiKeyInput.trim());
            setShowApiKeyDialog(false);
            setApiKeyInput('');
            handleAiSuggest(); // Automatically try again
        }
    };

    const confirmUpload = async () => {
        if (!pendingUploads.length) return;

        const uploadFiles = pendingUploads;
        setPendingUploads([]); // Clear dialog

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            const password = brandData.ftpPass || "tryte-999-en-Roste-Draes";
            formData.append('password', password);
            formData.append('action', 'upload');

            let totalFilesToUpload: File[] = [];

            // Clean the chosen SEO name to be safe
            const cleanSeoName = seoName.replace(/[^a-zA-Z0-9- ]/g, '').replace(/\s+/g, '-').toLowerCase();

            // Process files
            for (let i = 0; i < uploadFiles.length; i++) {
                setUploadProgress({ current: i, total: uploadFiles.length });
                const file = uploadFiles[i];

                // If multiple files, append index to the SEO name
                const finalSeoName = uploadFiles.length > 1 ? `${cleanSeoName}-${i + 1}` : cleanSeoName;

                if (file.type.startsWith('image/')) {
                    try {
                        const processed = await processImage(file, finalSeoName);
                        processed.forEach(p => totalFilesToUpload.push(p.file));
                    } catch (e) {
                        console.error("Failed to process image", e);
                        // Fallback but try to rename
                        const ext = file.name.split('.').pop() || '';
                        const renamedFile = new File([file], `${finalSeoName}.${ext}`, { type: file.type });
                        totalFilesToUpload.push(renamedFile);
                    }
                } else {
                    // video, audio, zip, misc, docs — rename with original extension
                    const ext = file.name.split('.').pop() || '';
                    const renamedFile = new File([file], `${finalSeoName}.${ext}`, { type: file.type });
                    totalFilesToUpload.push(renamedFile);
                }
            }

            setUploadProgress({ current: uploadFiles.length, total: uploadFiles.length });

            totalFilesToUpload.forEach(f => {
                formData.append('files[]', f);
            });

            const uploadUrl = `${brandData.serverBaseUrl}/media_manager.php?action=upload`;
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Upload failed: ${response.status} ${errText}`);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Server returned non-JSON: ${text}`);
            }

            if (data.error) {
                throw new Error(data.error);
            }

            // Refresh file list
            await fetchFiles();

        } catch (err: any) {
            console.error("Upload Error:", err);
            setError(err.message || 'Failed to upload files.');
        } finally {
            setUploading(false);
            setUploadProgress(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        await handleFileUpload(droppedFiles);
    };

    if (!isOpen) return null;

    const filteredFiles = files.filter(f => {
        if (filter === 'all') return true;
        if (filter === 'other') return f.type === 'zip' || f.type === 'misc';
        return f.type === filter;
    });
    const groupedFiles: ServerFile[] = [];

    // Group responsive images (e.g., `-480.webp`, `-960.webp`) into a single item
    const responsiveGroups = new Map<string, { base: string, widths: number[], date: number, size: number }>();

    filteredFiles.forEach(file => {
        const match = file.name.match(/^(.*)-(\d+)\.webp$/i);
        if (file.type === 'image' && match) {
            const baseName = match[1];
            const width = parseInt(match[2], 10);
            const group = responsiveGroups.get(baseName) || { base: file.url.replace(/-\d+\.webp$/i, ''), widths: [], date: file.date, size: file.size };
            group.widths.push(width);
            group.date = Math.max(group.date, file.date);
            group.size = Math.max(group.size, file.size);
            responsiveGroups.set(baseName, group);
        } else if (!file.name.match(/-\d+\.webp$/i)) {
            // Normal files (not matching the responsive pattern)
            groupedFiles.push({ ...file, _baseUrl: file.url } as any);
        }
    });

    // Add grouped responsive items
    responsiveGroups.forEach((data, baseName) => {
        const maxWidth = Math.max(...data.widths);
        const minWidth = Math.min(...data.widths);
        groupedFiles.push({
            name: baseName + ' (Responsive)',
            url: `${data.base}-${minWidth}.webp`, // Thumbnail uses smallest
            type: 'image',
            size: data.size,
            date: data.date,
            _baseUrl: `${data.base}-${maxWidth}.webp` // Full resolution uses largest available
        } as any);
    });

    // Sort "Other" tab: zip files first, then misc — each group sorted by newest first
    if (filter === 'other') {
        groupedFiles.sort((a, b) => {
            if (a.type === b.type) return b.date - a.date;
            if (a.type === 'zip') return -1;
            return 1;
        });
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className={`bg-zinc-900 border ${isDragging ? 'border-[var(--accent)] border-dashed border-2' : 'border-zinc-700'} rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors relative`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                    <div className="flex items-center gap-4">
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                            Server Media
                            {uploading && <span className="text-[var(--accent)] text-[10px] animate-pulse">Uploading {uploadProgress ? `${uploadProgress.current}/${uploadProgress.total}` : '...'}</span>}
                        </h3>
                        <div className="flex bg-zinc-800 rounded-lg p-1">
                            {(['all', 'image', 'video', 'audio', 'other'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${filter === tab ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {tab === 'other' ? 'Other' : `${tab}s`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp3,audio/wav,audio/aac,audio/m4a,audio/*,.zip,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.rar,.7z,.tar,.gz"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => { if (e.target.files) handleFileUpload(Array.from(e.target.files)) }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading || uploading}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-[var(--accent)] text-zinc-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex gap-2 items-center"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                            Upload
                        </button>
                        <button onClick={fetchFiles} disabled={loading || uploading} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" /></svg>
                        </button>
                        <button onClick={onClose} disabled={uploading} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-black/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="w-8 h-8 border-2 border-zinc-700 border-t-[var(--accent)] rounded-full animate-spin" />
                            <span className="text-zinc-500 text-xs uppercase tracking-widest">Loading...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-8">
                            <span className="text-red-400 text-sm font-mono">{error}</span>
                            <p className="text-zinc-500 text-xs max-w-md">Try uploading `media_manager.php` to your server root and checking your password.</p>
                            <button onClick={fetchFiles} className="text-white text-xs underline decoration-zinc-700 hover:decoration-white underline-offset-4">Retry</button>
                        </div>
                    ) : groupedFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2">
                            <span className="text-zinc-500 text-sm">No files found.</span>
                            <span className="text-zinc-600 text-xs">Upload files to the `media/` folder on your server via FTP.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {groupedFiles.map((file, idx) => {
                                // Extract the filename without the prepended URL base for deletion
                                // Always use file.url which contains the full relative path (e.g. media/video/filnavn.mp4)
                                const filenameForDeletion = file.url;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onSelect((file as any)._baseUrl)}
                                        className="group relative aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-[var(--accent)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    >
                                        {/* Delete Button (visible on hover) */}
                                        <div
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all z-20 hover:scale-110"
                                            onClick={(e) => handleDeleteFile(e, filenameForDeletion || file.url)} // use file.url not file.name to get the relative folder structure
                                            title="Delete Media"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>
                                        </div>

                                        {file.type === 'image' ? (
                                            <img src={`${brandData.serverBaseUrl}/${file.url}`} alt={file.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
                                        ) : file.type === 'audio' ? (
                                            <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-800 gap-2">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                                <span className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest">Audio</span>
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 text-center text-zinc-400 text-[9px] truncate px-3">
                                                    {file.name}
                                                </div>
                                            </div>
                                        ) : file.type === 'video' ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 gap-2">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                <span className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest">Video</span>
                                            </div>
                                        ) : file.type === 'zip' ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 gap-2">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>
                                                <span className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest">ZIP</span>
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 text-center text-zinc-400 text-[9px] truncate px-3">
                                                    {file.name}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-800 gap-2">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                <span className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest">{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 text-center text-zinc-400 text-[9px] truncate px-3">
                                                    {file.name}
                                                </div>
                                            </div>
                                        )}

                                        {/* Overlay Info */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 text-left z-10 pointer-events-none">
                                            <span className="text-white text-[10px] font-bold truncate">{file.name}</span>
                                            {/* Hide size for grouped responsive images as it represents only one size */}
                                            {!file.name.includes('(Responsive)') && <span className="text-zinc-400 text-[9px] font-mono">{Math.round(file.size / 1024)} KB</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Upload SEO Prompt Modal */}
                    {pendingUploads.length > 0 && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95">
                                <div>
                                    <h4 className="text-white font-bold text-lg">Name this file for Google (SEO)</h4>
                                    <p className="text-zinc-400 text-xs mt-1">A descriptive filename boosts your search ranking. Use keywords describing what is in the image.</p>
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        value={seoName}
                                        onChange={(e) => setSeoName(e.target.value)}
                                        placeholder="e.g. kraakefot live moss concert 2024"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)]"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') confirmUpload();
                                            if (e.key === 'Escape') setPendingUploads([]);
                                        }}
                                    />
                                    <button
                                        onClick={handleAiSuggest}
                                        disabled={aiLoading || !pendingUploads[0]?.type.startsWith('image/')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Generate SEO name with Gemini AI"
                                    >
                                        {aiLoading ? (
                                            <div className="w-4 h-4 border-2 border-zinc-600 border-t-amber-400 rounded-full animate-spin" />
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>
                                        )}
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[10px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                            AI Suggestion
                                        </div>
                                    </button>
                                </div>

                                {localStorage.getItem('gemini_api_key') && (
                                    <button
                                        onClick={() => { localStorage.removeItem('gemini_api_key'); setShowApiKeyDialog(true); }}
                                        className="text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-tighter text-left w-fit"
                                    >
                                        Change/Reset AI Key
                                    </button>
                                )}

                                <div className="text-[10px] text-zinc-500 font-mono">
                                    {(() => {
                                        const firstFile = pendingUploads[0];
                                        const isImg = firstFile?.type.startsWith('image/');
                                        const origExt = firstFile?.name.split('.').pop() || '';
                                        const suffix = isImg ? '-1920.webp' : `.${origExt}`;
                                        const cleanName = seoName.replace(/[^a-zA-Z0-9-æøåÆØÅ ]/g, '').replace(/\s+/g, '-').toLowerCase() || 'unnamed';
                                        return <>Resulting file: <span className="text-[var(--accent)]">{cleanName}{suffix}</span>{pendingUploads.length > 1 ? ` (+${pendingUploads.length - 1} more)` : ''}</>;
                                    })()}
                                </div>
                                <div className="flex gap-2 justify-end mt-2">
                                    <button
                                        onClick={() => setPendingUploads([])}
                                        className="px-4 py-2 text-zinc-400 hover:text-white text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmUpload}
                                        className="px-6 py-2 bg-[var(--accent)] text-white font-bold text-sm rounded-lg hover:brightness-110 transition-all shadow-[0_0_15px_var(--accent)] shadow-[var(--accent)]/20"
                                    >
                                        Upload
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API Key Modal */}
                    {showApiKeyDialog && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                            <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                                    </div>
                                    <h4 className="text-white font-bold">Gemini API Key</h4>
                                </div>
                                <p className="text-zinc-400 text-xs">
                                    Enter your free Google Gemini API key to enable AI features. It will be stored securely in your browser and never sent to our server.
                                </p>
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveApiKey();
                                        if (e.key === 'Escape') setShowApiKeyDialog(false);
                                    }}
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-500 hover:text-amber-400 underline decoration-amber-500/30 underline-offset-4">
                                        Get free API key
                                    </a>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowApiKeyDialog(false)} className="px-4 py-2 text-zinc-400 hover:text-white text-sm">Cancel</button>
                                        <button onClick={saveApiKey} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-lg transition-colors">Save</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Drag Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 bg-[var(--accent)]/10 backdrop-blur-sm flex items-center justify-center z-50 border-4 border-dashed border-[var(--accent)] m-4 rounded-xl pointer-events-none">
                            <div className="bg-zinc-900 border border-[var(--accent)] shadow-2xl rounded-2xl p-8 flex flex-col items-center gap-4 animate-in zoom-in-95">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                <span className="text-white font-bold uppercase tracking-widest text-lg">Drop to Upload</span>
                                <span className="text-zinc-400 text-xs">Images will be optimized to WebP automatically</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500 font-mono uppercase tracking-tight">
                    <span>{filteredFiles.length} items</span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={deployPhp}
                            disabled={deploying}
                            title="Upload the latest media_manager.php to the server"
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all border ${deployStatus === 'ok' ? 'border-green-500 text-green-400 bg-green-500/10' :
                                    deployStatus === 'error' ? 'border-red-500 text-red-400 bg-red-500/10' :
                                        'border-zinc-700 text-zinc-500 hover:border-[var(--accent)] hover:text-[var(--accent)]'
                                }`}
                        >
                            {deploying ? (
                                <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            ) : deployStatus === 'ok' ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : deployStatus === 'error' ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            ) : (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                            )}
                            {deploying ? 'Deploying...' : deployStatus === 'ok' ? 'Deployed!' : deployStatus === 'error' ? 'Failed' : 'Deploy PHP'}
                        </button>
                        <span>Server: {brandData.serverBaseUrl}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
