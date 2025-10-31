import React, { useState } from 'react';
import FileUpload from './FileUpload';

interface ManualEntryRow {
  id: number;
  height: string;
  delivery: string;
}

interface ValidationDataInputProps {
  onFileUpload: (file: File) => void;
  onManualSubmit: (data: { height: number; delivery: number }[]) => void;
  isLoading: boolean;
}

const ValidationDataInput: React.FC<ValidationDataInputProps> = ({ onFileUpload, onManualSubmit, isLoading }) => {
  const [inputType, setInputType] = useState<'upload' | 'manual'>('upload');
  const [rows, setRows] = useState<ManualEntryRow[]>([
    { id: 1, height: '109', delivery: '0' },
    { id: 2, height: '235', delivery: '7150' },
    { id: 3, height: '436', delivery: '7199' },
  ]);
  const [nextId, setNextId] = useState(4);

  const handleRowChange = (id: number, field: 'height' | 'delivery', value: string) => {
    const newRows = rows.map(row => (row.id === id ? { ...row, [field]: value } : row));
    setRows(newRows);
  };

  const handleAddRow = () => {
    setRows([...rows, { id: nextId, height: '', delivery: '' }]);
    setNextId(nextId + 1);
  };

  const handleRemoveRow = (id: number) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleSubmit = () => {
    const parsedData = rows.map(row => ({
      height: parseFloat(row.height),
      delivery: parseFloat(row.delivery)
    })).filter(d => !isNaN(d.height) && !isNaN(d.delivery));
    onManualSubmit(parsedData);
  };

  const renderManualInput = () => (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <div className="bg-slate-50 p-4 rounded-lg shadow-inner">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Height (mm)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Delivery (Liter)</th>
                <th className="relative px-6 py-3"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={row.height}
                      onChange={(e) => handleRowChange(row.id, 'height', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 109"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={row.delivery}
                      onChange={(e) => handleRowChange(row.id, 'delivery', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 7150"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleRemoveRow(row.id)} className="text-red-600 hover:text-red-900">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between items-center">
            <button
                onClick={handleAddRow}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Add Row
            </button>
            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
            >
                {isLoading ? 'Processing...' : 'Validate Data'}
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-700 text-center mb-2">Step 3: Upload or Enter Field Check Data</h2>
        <p className="text-slate-500 text-center mb-6">Choose to upload a file or enter data manually for validation.</p>
        
        <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                    type="button"
                    onClick={() => setInputType('upload')}
                    className={`px-4 py-2 text-sm font-medium border rounded-l-lg transition-colors ${inputType === 'upload' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}
                >
                    Upload File
                </button>
                <button
                    type="button"
                    onClick={() => setInputType('manual')}
                    className={`px-4 py-2 text-sm font-medium border rounded-r-lg transition-colors ${inputType === 'manual' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}
                >
                    Enter Manually
                </button>
            </div>
        </div>

        {inputType === 'upload' ? (
            <FileUpload
                onFileUpload={onFileUpload}
                title=""
                description="Upload a CSV/TXT file with point validation (Height, Volume) or delivery validation (Height, Fuel Delivery)."
                isLoading={isLoading}
                acceptedFileType=".csv,.txt"
            />
        ) : (
            renderManualInput()
        )}
    </div>
  );
};

export default ValidationDataInput;