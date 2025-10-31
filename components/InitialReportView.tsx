import React, { useState, useRef } from 'react';
import { ProcessedData, ValidationStats, ReportConfig } from '../types';
import ChartComponent, { ChartRef } from './Chart';
import DataTable from './DataTable';
import { exportToPDF, exportToExcel, exportStrappingChartToPDF, exportStrappingChartToExcel, exportStrappingChartToWord } from '../services/exportService';


// Access jsPDF and saveAs from global scope
declare const jsPDF: any;
declare const saveAs: any;

interface ChartEditorModalProps {
    data: ProcessedData[];
    config: ReportConfig;
    onClose: () => void;
}

const ChartEditorModal: React.FC<ChartEditorModalProps> = ({ data, config, onClose }) => {
    const [xAxisLabel, setXAxisLabel] = useState(config.heightHeader);
    const [yAxisLabel, setYAxisLabel] = useState(config.volumeHeader);
    const [font, setFont] = useState('sans-serif');
    const [fontSize, setFontSize] = useState(12);
    const [exportFormat, setExportFormat] = useState('PNG');
    
    const chartComponentRef = useRef<ChartRef>(null);

    const handleExport = () => {
        const chartInstance = chartComponentRef.current?.getChartInstance();
        if (!chartInstance) {
            alert("Chart instance not available.");
            return;
        }
        
        const client = config.clientName?.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-') || 'Client';
        const tank = config.tankCode?.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-') || 'Tank';
        const baseFilename = ((client === 'Client' || client === 'Default_Client') && tank === 'Tank') ? 'chart_export' : `${client}_${tank}`;

        const filename = `${baseFilename}_${new Date().toISOString().split('T')[0]}`;
        const formatLower = exportFormat.toLowerCase();
        
        if (exportFormat === 'PNG' || exportFormat === 'JPEG') {
            const mimeType = `image/${formatLower}`;
            const imageUrl = chartInstance.toBase64Image(mimeType, 1.0);
            fetch(imageUrl).then(res => res.blob()).then(blob => {
                 saveAs(blob, `${filename}.${formatLower}`);
            });
        } else if (exportFormat === 'PDF') {
            const imgData = chartInstance.toBase64Image('image/jpeg', 1.0);
            const doc = new (window as any).jspdf.jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [chartInstance.width, chartInstance.height]
            });

            doc.addImage(imgData, 'JPEG', 0, 0, chartInstance.width, chartInstance.height);
            doc.save(`${filename}.pdf`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Chart Editor & Exporter</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light">&times;</button>
                </div>
                
                <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
                    {/* Controls Panel */}
                    <div className="w-full md:w-1/4 flex-shrink-0 space-y-4 overflow-y-auto p-2">
                        <h3 className="text-lg font-semibold text-slate-700">Customize Chart</h3>
                        <div>
                            <label htmlFor="xAxisLabel" className="block text-sm font-medium text-gray-700">X-Axis Label</label>
                            <input type="text" id="xAxisLabel" value={xAxisLabel} onChange={(e) => setXAxisLabel(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                            <label htmlFor="yAxisLabel" className="block text-sm font-medium text-gray-700">Y-Axis Label</label>
                            <input type="text" id="yAxisLabel" value={yAxisLabel} onChange={(e) => setYAxisLabel(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                            <label htmlFor="font" className="block text-sm font-medium text-gray-700">Label Font</label>
                            <select id="font" value={font} onChange={(e) => setFont(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md">
                                <option value="sans-serif">Sans-serif</option>
                                <option value="serif">Serif</option>
                                <option value="monospace">Monospace</option>
                                <option value="Arial">Arial</option>
                                <option value="Times New Roman">Times New Roman</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700">Label Font Size (px)</label>
                            <input type="number" id="fontSize" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value, 10))} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-semibold text-slate-700">Export</h3>
                            <div>
                                <label htmlFor="exportFormat" className="block text-sm font-medium text-gray-700">Format</label>
                                <select id="exportFormat" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md">
                                    <option value="PNG">PNG</option>
                                    <option value="JPEG">JPEG / JPG</option>
                                    <option value="PDF">PDF</option>
                                </select>
                            </div>
                            <button onClick={handleExport} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                                Export as {exportFormat}
                            </button>
                        </div>
                    </div>
                    
                    {/* Chart Preview */}
                    <div className="flex-grow w-full md:w-3/4 bg-slate-50 rounded-lg p-4 overflow-hidden">
                       <ChartComponent
                           ref={chartComponentRef}
                           data={data}
                           config={config}
                           xAxisLabel={xAxisLabel}
                           yAxisLabel={yAxisLabel}
                           font={font}
                           fontSize={fontSize}
                       />
                    </div>
                </div>
            </div>
        </div>
    );
};


interface InitialReportViewProps {
    data: ProcessedData[];
    stats: ValidationStats | null;
    config: ReportConfig;
    onNavigateToValidation: () => void;
    onSaveProject: () => void;
}

const generateBaseFilename = (config: ReportConfig): string => {
    const client = config.clientName?.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-') || 'Client';
    const tank = config.tankCode?.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-') || 'Tank';
    if ((client === 'Client' || client === 'Default_Client') && tank === 'Tank') {
        return 'Untitled_Analysis';
    }
    return `${client}_${tank}`;
};

const InitialReportView: React.FC<InitialReportViewProps> = (props) => {
    const [isChartEditorOpen, setIsChartEditorOpen] = useState(false);
    const baseFilename = generateBaseFilename(props.config);

    const handleExportPDF = () => {
        const pdfTitle = `${props.config.clientName} - ${props.config.tankCode || 'N/A'} - Initial Analysis Report`;
        const pdfFilename = `${baseFilename}_Initial_Analysis.pdf`;
        exportToPDF(props.data, props.config, pdfTitle, props.stats, pdfFilename);
    };

    const handleExportExcel = () => {
        const filename = `${baseFilename}_Initial_Analysis.xlsx`;
        exportToExcel(props.data, props.config, filename, props.stats);
    };

    const handleExportStrappingPDF = () => exportStrappingChartToPDF(props.data, props.config);
    const handleExportStrappingExcel = () => exportStrappingChartToExcel(props.data, props.config);
    const handleExportStrappingWord = () => exportStrappingChartToWord(props.data, props.config);
    
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800">Step 3: Analysis & Next Steps</h2>
                <p className="text-slate-500 mt-2">
                    Review the initial analysis of your data. You can now export this view, or proceed to generate a formatted report from a template or validate the data with field measurements.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start bg-slate-50 p-6 rounded-xl shadow-inner">
                <div className="space-y-8">
                     <div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-4 text-center">Next Actions</h3>
                        <div className="flex flex-col space-y-4 max-w-sm mx-auto">
                            <button onClick={props.onNavigateToValidation} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                                Validate with Field Data
                            </button>
                        </div>
                     </div>
                     <div className="pt-6 border-t">
                        <h3 className="text-xl font-semibold text-slate-700 mb-4 text-center">Generate A4 Strapping Chart</h3>
                        <p className="text-sm text-slate-500 text-center mb-4">Export a 300-point, single-page chart for printing.</p>
                        <div className="flex justify-center items-center gap-4 flex-wrap">
                            <button onClick={handleExportStrappingPDF} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow transition">PDF</button>
                            <button onClick={handleExportStrappingExcel} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg shadow transition">Excel</button>
                             <button onClick={handleExportStrappingWord} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow transition">Word</button>
                        </div>
                     </div>
                      <div className="pt-6 border-t text-center">
                        <h3 className="text-lg font-semibold text-slate-600 mb-3">Or Export Current Table View</h3>
                        <div className="flex justify-center items-center gap-4">
                            <button onClick={handleExportPDF} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg shadow transition">Export PDF</button>
                            <button onClick={handleExportExcel} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg shadow transition">Export Excel</button>
                             <button onClick={props.onSaveProject} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg shadow transition">Save Project</button>
                        </div>
                     </div>
                </div>
                 <div className="h-full">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4 text-center">Volume vs. Height Chart</h3>
                    <div className="bg-white p-2 rounded-lg shadow">
                      <ChartComponent data={props.data} config={props.config} />
                    </div>
                     <div className="text-center mt-4">
                        <button 
                            onClick={() => setIsChartEditorOpen(true)}
                            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg shadow transition">
                            Edit and Export Chart
                        </button>
                    </div>
                </div>
            </div>
            
            <DataTable data={props.data} config={props.config} hasValidationData={false} />

            {isChartEditorOpen && (
                <ChartEditorModal
                    data={props.data}
                    config={props.config}
                    onClose={() => setIsChartEditorOpen(false)}
                />
            )}
        </div>
    );
};

export default InitialReportView;