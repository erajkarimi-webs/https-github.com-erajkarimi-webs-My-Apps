import React, { useState } from 'react';
import { ReportConfig } from '../types';

interface ConfigurationFormProps {
    initialConfig: ReportConfig;
    onSubmit: (config: ReportConfig) => void;
}

const defaultClients = [
    'AlMaha Petroleum',
    'OmanOil Marketing',
    'Shell Oman',
    'Moosa Walid',
    'APEX Oman',
    'Mazaya Fueling',
    'Petroley',
    'Petrolat',
    'Well Petroleum',
];

const defaultCalibrators = [
    'AlDhafer International',
    'JV Diqqa and AlDhafer International',
];

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({ initialConfig, onSubmit }) => {
    const [config, setConfig] = useState<ReportConfig>(initialConfig);
    const [isCustomClient, setIsCustomClient] = useState(!defaultClients.includes(initialConfig.clientName) && initialConfig.clientName !== 'Default Client');
    const [isCustomCalibrator, setIsCustomCalibrator] = useState(!defaultCalibrators.includes(initialConfig.calibrationCompany) && !!initialConfig.calibrationCompany);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(config);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === "clientNameSelect") {
            if (value === "OTHER") {
                setIsCustomClient(true);
                setConfig(prev => ({ ...prev, clientName: '' }));
            } else {
                setIsCustomClient(false);
                setConfig(prev => ({ ...prev, clientName: value }));
            }
        } else if (name === "calibrationCompanySelect") {
             if (value === "OTHER") {
                setIsCustomCalibrator(true);
                setConfig(prev => ({ ...prev, calibrationCompany: '' }));
            } else {
                setIsCustomCalibrator(false);
                setConfig(prev => ({ ...prev, calibrationCompany: value }));
            }
        } else {
             setConfig(prev => ({ ...prev, [name]: name === 'decimalPlaces' ? parseInt(value) : value }));
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-700 text-center mb-6">Step 2: Configure Report Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6 bg-slate-50 p-8 rounded-lg">
                 <h3 className="text-lg font-medium text-slate-600 border-b pb-2">Client & Tank Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label htmlFor="clientNameSelect" className="block text-sm font-medium text-gray-700">Client Name</label>
                        <select id="clientNameSelect" name="clientNameSelect" onChange={handleInputChange} value={isCustomClient ? 'OTHER' : config.clientName} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md">
                            {config.clientName === 'Default Client' && <option value="Default Client" disabled>Select a client...</option>}
                            {defaultClients.map(client => <option key={client} value={client}>{client}</option>)}
                            <option value="OTHER">Other (Specify)</option>
                        </select>
                    </div>
                    {isCustomClient && (
                         <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Custom Client Name</label>
                            <input type="text" name="clientName" id="clientName" value={config.clientName} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required/>
                        </div>
                    )}
                     <div>
                        <label htmlFor="tankCode" className="block text-sm font-medium text-gray-700">Tank Code / Name</label>
                        <input type="text" name="tankCode" id="tankCode" value={config.tankCode} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                     <div>
                        <label htmlFor="tankDiameter" className="block text-sm font-medium text-gray-700">Tank Diameter</label>
                        <input type="text" name="tankDiameter" id="tankDiameter" value={config.tankDiameter} onChange={handleInputChange} placeholder="e.g., 3m" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                     <div>
                        <label htmlFor="tankHeight" className="block text-sm font-medium text-gray-700">Tank Height</label>
                        <input type="text" name="tankHeight" id="tankHeight" value={config.tankHeight} onChange={handleInputChange} placeholder="e.g., 10m" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="tankLength" className="block text-sm font-medium text-gray-700">Tank Length</label>
                        <input type="text" name="tankLength" id="tankLength" value={config.tankLength} onChange={handleInputChange} placeholder="e.g., 15m" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="tankCapacity" className="block text-sm font-medium text-gray-700">Tank Capacity</label>
                        <input type="text" name="tankCapacity" id="tankCapacity" value={config.tankCapacity} onChange={handleInputChange} placeholder="e.g., 50,000L" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                </div>
                 <h3 className="text-lg font-medium text-slate-600 border-b pb-2 pt-4">Calibration Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="calibrationDate" className="block text-sm font-medium text-gray-700">Date of Calibration</label>
                        <input type="date" name="calibrationDate" id="calibrationDate" value={config.calibrationDate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                     <div>
                        <label htmlFor="calibrationCompanySelect" className="block text-sm font-medium text-gray-700">Calibration By</label>
                        <select id="calibrationCompanySelect" name="calibrationCompanySelect" onChange={handleInputChange} value={isCustomCalibrator ? 'OTHER' : config.calibrationCompany} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md">
                            {!config.calibrationCompany && <option value="" disabled>Select a calibrator...</option>}
                            {defaultCalibrators.map(c => <option key={c} value={c}>{c}</option>)}
                            <option value="OTHER">Other (Specify)</option>
                        </select>
                    </div>
                    {isCustomCalibrator && (
                         <div>
                            <label htmlFor="calibrationCompany" className="block text-sm font-medium text-gray-700">Custom Calibrator Name</label>
                            <input type="text" name="calibrationCompany" id="calibrationCompany" value={config.calibrationCompany} onChange={handleInputChange} placeholder="e.g., Tank Solutions Inc." className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required/>
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-medium text-slate-600 border-b pb-2 pt-4">Table Formatting Options</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="heightHeader" className="block text-sm font-medium text-gray-700">Height Column Header</label>
                        <input type="text" name="heightHeader" id="heightHeader" value={config.heightHeader} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="volumeHeader" className="block text-sm font-medium text-gray-700">Volume Column Header</label>
                        <input type="text" name="volumeHeader" id="volumeHeader" value={config.volumeHeader} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label htmlFor="columnOrder" className="block text-sm font-medium text-gray-700">Column Order</label>
                        <select id="columnOrder" name="columnOrder" value={config.columnOrder} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md">
                            <option value="height-volume">Height, then Volume</option>
                            <option value="volume-height">Volume, then Height</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="decimalPlaces" className="block text-sm font-medium text-gray-700">Decimal Places for Volume</label>
                        <input type="number" name="decimalPlaces" id="decimalPlaces" value={config.decimalPlaces} onChange={handleInputChange} min="0" max="10" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                </div>
                <div className="pt-4 text-center">
                    <button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Analyze Data & Prepare for Export
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ConfigurationForm;