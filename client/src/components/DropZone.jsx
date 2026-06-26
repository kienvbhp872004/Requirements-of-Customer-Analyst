import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X } from 'lucide-react';

export default function DropZone({ file, onFile }) {
  const onDrop = useCallback((accepted) => {
    if (accepted[0]) onFile(accepted[0]);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'], 'text/markdown': ['.md'] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone ${isDragActive ? 'dropzone--active' : ''} ${file ? 'dropzone--filled' : ''}`}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="dropzone__file">
          <FileText size={20} />
          <span>{file.name}</span>
          <button
            className="dropzone__remove"
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="dropzone__hint">
          <UploadCloud size={28} />
          <p>Drop a <strong>.txt</strong> or <strong>.md</strong> file here, or click to browse</p>
        </div>
      )}
    </div>
  );
}
