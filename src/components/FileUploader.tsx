import React, { useState, useCallback, useRef } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { toast } from 'sonner';

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface FileUploaderProps {
  leadId: string;
  existingFiles?: UploadedFile[];
  onUploadComplete: (files: UploadedFile[]) => void;
  folder?: string;
}

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export default function FileUploader({ leadId, existingFiles = [], onUploadComplete, folder = 'assets' }: FileUploaderProps) {
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [allUploaded, setAllUploaded] = useState<UploadedFile[]>(existingFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startUpload = (file: File) => {
    const id = Math.random().toString(36).substring(7) + '-' + file.name;
    const newTask: UploadTask = { id, file, progress: 0, status: 'uploading' };
    
    setUploads(prev => [...prev, newTask]);

    const storageRef = ref(storage, `leads/${leadId}/${folder}/${file.name}-${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploads(prev => prev.map(t => t.id === id ? { ...t, progress } : t));
      }, 
      (error) => {
        console.error("Upload error", error);
        setUploads(prev => prev.map(t => t.id === id ? { ...t, status: 'error', error: error.message } : t));
        toast.error(`Failed to upload ${file.name}`);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUploads(prev => prev.map(t => t.id === id ? { ...t, status: 'success', progress: 100, url: downloadURL } : t));
        
        const newFile: UploadedFile = {
            name: file.name,
            url: downloadURL,
            size: file.size,
            type: file.type
        };
        
        setAllUploaded(prev => {
            const updated = [...prev, newFile];
            onUploadComplete(updated);
            return updated;
        });
        toast.success(`${file.name} uploaded!`);
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        Array.from(e.target.files).forEach(file => startUpload(file));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
        Array.from(e.dataTransfer.files).forEach(file => startUpload(file));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const removeFile = (indexToRemove: number) => {
      setAllUploaded(prev => {
          const updated = prev.filter((_, i) => i !== indexToRemove);
          onUploadComplete(updated);
          return updated;
      });
  };

  return (
    <div className="w-full space-y-4">
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="w-full border-2 border-dashed border-white/20 hover:border-white/40 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.05]"
      >
        <UploadCloud className="text-white/40 mb-3" size={32} />
        <p className="text-sm text-white font-bold mb-1">Click to upload or drag & drop</p>
        <p className="text-xs text-white/40 font-mono">Supports multi-file upload</p>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            multiple 
            className="hidden" 
        />
      </div>

      {(uploads.length > 0 || allUploaded.length > 0) && (
          <div className="space-y-2">
            <h4 className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-mono mb-2">Assets</h4>
            
            {/* Completed Files */}
            {allUploaded.map((file, i) => (
                <div key={`done-${i}`} className="flex items-center justify-between bg-[#000000]/40 border border-white/[0.02] p-3 rounded-2xl group">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon size={16} className="text-white/60 shrink-0" />
                        <div className="truncate">
                            <a href={file.url} target="_blank" rel="noreferrer" className="text-sm text-white hover:underline truncate block">
                                {file.name}
                            </a>
                            <span className="text-[10px] text-white/60 font-mono">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-white/60 hover:text-[#FF453A] p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                    </button>
                </div>
            ))}

            {/* Active Uploads */}
            {uploads.filter(u => u.status === 'uploading').map(upload => (
                <div key={upload.id} className="bg-[#000000]/40 border border-white/20 p-3 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-white/10 transition-all duration-300" style={{ width: `${upload.progress}%` }}></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Loader2 size={16} className="text-white/80 animate-spin shrink-0" />
                            <div>
                                <p className="text-sm text-white truncate">{upload.file.name}</p>
                                <span className="text-[10px] text-white/80 font-mono">
                                    {Math.round(upload.progress)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Error Uploads */}
            {uploads.filter(u => u.status === 'error').map(upload => (
                <div key={upload.id} className="bg-[#FF3B30]/10 border border-[#FF3B30]/30 p-3 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={16} className="text-[#FF453A] shrink-0" />
                        <div>
                            <p className="text-sm text-red-200 truncate">{upload.file.name}</p>
                            <span className="text-[10px] text-[#FF453A] font-mono">{upload.error}</span>
                        </div>
                    </div>
                </div>
            ))}
          </div>
      )}
    </div>
  );
}
