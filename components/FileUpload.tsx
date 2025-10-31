import React, { useCallback, useState } from 'react';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    title: string;
    description: string;
    isLoading: boolean;
    file?: File | null;
    acceptedFileType?: string;
}

const FileIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);


const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, title, description, isLoading, file, acceptedFileType = ".txt" }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileUpload(e.dataTransfer.files[0]);
        }
    }, [onFileUpload]);

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e);
        setIsDragging(true);
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e);
        setIsDragging(false);
    };

    const dataFileTypes = acceptedFileType.split(',').filter(t => t !== '.adf' && t !== '.json').map(t => t.toUpperCase().replace('.', '')).join(' or ');

    return (
        <div className="w-full max-w-3xl mx-auto">
             {title && <h2 className="text-2xl font-bold text-slate-700 text-center mb-2">{title}</h2>}
             {description && <p className="text-slate-500 text-center mb-6">{description}</p>}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragEvents}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`relative flex justify-center items-center w-full px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
            >
                <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer w-full">
                    {isLoading ? (
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-3"></div>
                            <span className="text-gray-500 font-medium">Processing...</span>
                        </div>
                    ) : file ? (
                        <div className="text-center">
                            <svg className="w-10 h-10 mb-3 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <p className="text-lg font-semibold text-slate-700">{file.name}</p>
                            {file.size > 0 && <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>}
                            <p className="mt-2 text-sm text-indigo-600 font-semibold">Click or drag to replace</p>
                        </div>
                    ) : (
                        <div className="text-center">
                           <FileIcon />
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">{dataFileTypes} file up to 10MB</p>
                        </div>
                    )}
                </label>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept={acceptedFileType} />
            </div>
        </div>
    );
};

export default FileUpload;
