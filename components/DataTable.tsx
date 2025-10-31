import React from 'react';
import { ProcessedData, ReportConfig } from '../types';

interface DataTableProps {
    data: ProcessedData[];
    config: ReportConfig;
    hasValidationData: boolean;
}

const getDeviationColor = (deviation: number, maxAbsDeviation: number): string => {
    if (deviation === 0 || maxAbsDeviation === 0) return 'bg-white';
    const percentage = Math.abs(deviation) / maxAbsDeviation;
    if (percentage > 0.75) return 'bg-red-200';
    if (percentage > 0.25) return 'bg-yellow-100';
    return 'bg-green-100';
};


const DataTable: React.FC<DataTableProps> = ({ data, config, hasValidationData }) => {
    
    const maxAbsDeviation = hasValidationData ? Math.max(...data.map(d => Math.abs(d.deviation || 0))) : 0;
    
    const headers = [];
    if (config.columnOrder === 'height-volume') {
        headers.push(config.heightHeader);
    }
    headers.push(config.volumeHeader);
    if (config.columnOrder === 'volume-height') {
        headers.push(config.heightHeader);
    }

    if(hasValidationData) {
        headers[headers.indexOf(config.volumeHeader)] = `Chart ${config.volumeHeader}`;
        headers.push(`Field ${config.volumeHeader}`);
        headers.push('Deviation');
    }

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
                        {data.map((row, index) => {
                            const deviationColor = hasValidationData && row.deviation !== undefined
                                ? getDeviationColor(row.deviation, maxAbsDeviation)
                                : 'bg-white';
                                
                            const heightCell = <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{row.height.toFixed(config.decimalPlaces)}</td>;
                            const chartVolumeCell = <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{row.chartVolume.toFixed(config.decimalPlaces)}</td>;
                            
                            return (
                                <tr key={index} className="hover:bg-gray-50">
                                    {config.columnOrder === 'height-volume' ? <>{heightCell}{chartVolumeCell}</> : <>{chartVolumeCell}{heightCell}</>}
                                    {hasValidationData && (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {row.fieldVolume?.toFixed(config.decimalPlaces) || 'N/A'}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${deviationColor}`}>
                                                {row.deviation?.toFixed(config.decimalPlaces) || 'N/A'}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;