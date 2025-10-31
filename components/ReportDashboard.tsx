import React, { useRef } from 'react';
import { ProcessedData, ValidationStats, ReportConfig, DeliveryValidationData } from '../types';
import { exportToPDF, exportToExcel } from '../services/exportService';
import DataTable from './DataTable';

declare const html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
declare const saveAs: (blob: Blob, filename: string) => void;


interface ReportDashboardProps {
    data: ProcessedData[];
    stats: ValidationStats | null;
    config: ReportConfig;
    onReset: () => void;
    onSaveProject: () => void;
    deliveryData: DeliveryValidationData[] | null;
}

const StatCard: React.FC<{ title: string; value: string; subtext?: string; color: string; }> = ({ title, value, subtext, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
        <p className={`mt-1 text-3xl font-semibold ${color}`}>{value}</p>
        {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
    </div>
);

const getDeviationColor = (deviation: number, maxAbsDeviation: number): string => {
    if (deviation === 0 || maxAbsDeviation === 0) return 'bg-white';
    const percentage = Math.abs(deviation) / maxAbsDeviation;
    if (percentage > 0.75) return 'bg-red-200';
    if (percentage > 0.25) return 'bg-yellow-100';
    return 'bg-green-100';
};

const DeliveryDataTable: React.FC<{ data: DeliveryValidationData[], config: ReportConfig }> = ({ data, config }) => {
    const headers = [
        `Fuel Level Before (${config.heightHeader.match(/\(([^)]+)\)/)?.[1] || 'units'})`,
        `Fuel Level After (${config.heightHeader.match(/\(([^)]+)\)/)?.[1] || 'units'})`,
        `Reported Delivery (${config.volumeHeader.match(/\(([^)]+)\)/)?.[1] || 'units'})`,
        `Chart Calculated Delivery (${config.volumeHeader.match(/\(([^)]+)\)/)?.[1] || 'units'})`,
        `Deviation (${config.volumeHeader.match(/\(([^)]+)\)/)?.[1] || 'units'})`,
    ];
    const maxAbsDeviation = Math.max(...data.map(d => Math.abs(d.deviation || 0)));

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            {headers.map(header => (
                                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{row.heightBefore.toFixed(config.decimalPlaces)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{row.heightAfter.toFixed(config.decimalPlaces)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{row.reportedDelivery.toFixed(config.decimalPlaces)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{row.chartCalculatedDelivery.toFixed(config.decimalPlaces)}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getDeviationColor(row.deviation, maxAbsDeviation)}`}>
                                    {row.deviation.toFixed(config.decimalPlaces)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const generateBaseFilename = (config: ReportConfig): string => {
    const client = config.clientName?.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-') || 'Client';
    const tank = config.tankCode?.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-') || 'Tank';
    if ((client === 'Client' || client === 'Default_Client') && tank === 'Tank') {
        return 'Untitled_Report';
    }
    return `${client}_${tank}`;
};

const ReportDashboard: React.FC<ReportDashboardProps> = ({ data, stats, config, onReset, onSaveProject, deliveryData }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const reportType = deliveryData ? 'Delivery_Validation' : stats ? 'Point_Validation' : 'Interpolation';
    const title = `${reportType} Report`;
    const baseFilename = generateBaseFilename(config);

    const handleExportPDF = () => {
        const pdfTitle = `${config.clientName} - ${config.tankCode || 'N/A'} - ${title}`;
        const pdfFilename = `${baseFilename}_${reportType}_Report.pdf`;
        exportToPDF(data, config, pdfTitle, stats, pdfFilename);
    };
    
    const handleExportExcel = () => {
        const filename = `${baseFilename}_${reportType}_Report.xlsx`;
        exportToExcel(data, config, filename, stats);
    };

    const handleExportPNG = async () => {
        if (!reportRef.current) return;
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // Higher scale for better resolution
                useCORS: true,
                backgroundColor: '#f1f5f9' // Match body bg
            });
            canvas.toBlob((blob) => {
                if (blob) {
                    saveAs(blob, `${baseFilename}_${reportType}_Report.png`);
                }
            });
        } catch (error) {
            console.error("Failed to export as PNG:", error);
        }
    };

    return (
        <div className="space-y-8" ref={reportRef}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">
                        {title}
                    </h2>
                    <p className="text-slate-500">
                        {stats 
                            ? `Complete validation analysis of ${stats.totalMeasurements} ${deliveryData ? 'deliveries' : 'measurements'}.` 
                            : `Interpolated volumes for ${data.length} provided heights.`}
                    </p>
                </div>
                 <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button onClick={handleExportPNG} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg shadow transition">Export PNG</button>
                    <button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow transition">Export PDF</button>
                    <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow transition">Export Excel</button>
                    <button onClick={onSaveProject} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg shadow transition">Save Project</button>
                    <button onClick={onReset} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow transition">Start Over</button>
                </div>
            </div>

            {stats && (
                <div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Validation Statistics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title={deliveryData ? 'Total Deliveries' : 'Total Measurements'} value={stats.totalMeasurements.toString()} color="text-indigo-600" />
                        <StatCard title="Average Deviation" value={stats.averageDeviation.toFixed(config.decimalPlaces)} subtext={config.volumeHeader.match(/\(([^)]+)\)/)?.[1] || 'units'} color="text-blue-600" />
                        <StatCard title="Max Positive Deviation" value={`+${stats.maxDeviation.value.toFixed(config.decimalPlaces)}`} subtext={deliveryData ? `for delivery to ${stats.maxDeviation.height}m` : `at ${stats.maxDeviation.height.toFixed(2)}m`} color="text-red-600" />
                        <StatCard title="Max Negative Deviation" value={stats.minDeviation.value.toFixed(config.decimalPlaces)} subtext={deliveryData ? `for delivery to ${stats.minDeviation.height}m` : `at ${stats.minDeviation.height.toFixed(2)}m`} color="text-green-600" />
                    </div>
                </div>
            )}
            
            {deliveryData ? (
                <DeliveryDataTable data={deliveryData} config={config} />
            ) : (
                <DataTable data={data} config={config} hasValidationData={!!stats} />
            )}
        </div>
    );
};

export default ReportDashboard;