import React, { useState, useRef } from 'react';
import FileUpload from './components/FileUpload';
import ConfigurationForm from './components/ConfigurationForm';
import InitialReportView from './components/InitialReportView';
import ReportDashboard from './components/ReportDashboard';
import StepIndicator from './components/StepIndicator';
import ValidationDataInput from './components/ValidationDataInput';
import MenuBar from './components/MenuBar'; // Import the new MenuBar component
import { ReportConfig, ProcessedData, ValidationStats, Step, ProjectState, DeliveryValidationData } from './types';
import { processAndAnalyzeData, fileToText, processValidationData, calculateDeliveryValidation } from './services/dataProcessor';

// Use saveAs from CDN script, declare for TypeScript
declare const saveAs: (blob: Blob, filename: string) => void;

const App: React.FC = () => {
    const [step, setStep] = useState<Step>(Step.UploadChart);
    const [chartFile, setChartFile] = useState<File | null>(null);
    const [projectFileName, setProjectFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const openProjectInputRef = useRef<HTMLInputElement>(null);


    const [processedData, setProcessedData] = useState<ProcessedData[]>([]);
    const [validationStats, setValidationStats] = useState<ValidationStats | null>(null);
    const [deliveryValidationData, setDeliveryValidationData] = useState<DeliveryValidationData[] | null>(null);
    const [reportConfig, setReportConfig] = useState<ReportConfig>({
        clientName: 'Default Client',
        tankCode: '',
        tankDiameter: '',
        tankHeight: '',
        tankLength: '',
        tankCapacity: '',
        calibrationDate: new Date().toISOString().split('T')[0],
        calibrationCompany: '',
        heightHeader: 'Height (m)',
        volumeHeader: 'Volume (L)',
        columnOrder: 'height-volume',
        decimalPlaces: 2,
    });
    
    const clearMessages = () => {
        setError(null);
        setSuccessMessage(null);
    };

    const handleChartUpload = async (uploadedFile: File) => {
        clearMessages();
        setChartFile(uploadedFile);
        setProjectFileName(null); // Reset project file name when a new chart is uploaded
        setIsLoading(true);
        try {
            const fileText = await fileToText(uploadedFile);
            const { data, stats, initialConfig } = await processAndAnalyzeData(fileText);
            setProcessedData(data);
            setValidationStats(stats); // This would be from a combined file
            setReportConfig(prev => ({ ...prev, ...initialConfig }));
            setStep(Step.Configure);
        } catch (err) {
            setError((err as Error).message);
            setChartFile(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfigSubmit = (config: ReportConfig) => {
        clearMessages();
        setReportConfig(config);
        setStep(Step.Analysis);
    };

    const handleValidationUpload = async (validationFile: File) => {
        clearMessages();
        setIsLoading(true);
        try {
            const validationText = await fileToText(validationFile);
            const result = await processValidationData(validationText, processedData);

            if (result.type === 'delivery_validation') {
                setDeliveryValidationData(result.deliveryData);
                setValidationStats(result.stats);
                setProcessedData(processedData); // Keep original chart data
            } else { // point_validation
                setProcessedData(result.combinedData);
                setValidationStats(result.stats);
                setDeliveryValidationData(null); // Clear other validation type
            }
            setStep(Step.FinalReport);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualValidationSubmit = async (points: { height: number; delivery: number }[]) => {
        clearMessages();
        setIsLoading(true);
        try {
            if (points.length < 2) {
                throw new Error("Delivery validation requires at least two data points (e.g., before and after delivery).");
            }
            const result = calculateDeliveryValidation(points, processedData);
            
            setDeliveryValidationData(result.deliveryData);
            setValidationStats(result.stats);
            setProcessedData(processedData); // Keep original chart data
            setStep(Step.FinalReport);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setStep(Step.UploadChart);
        setChartFile(null);
        setProjectFileName(null);
        setProcessedData([]);
        setValidationStats(null);
        setDeliveryValidationData(null);
        clearMessages();
        setReportConfig({
            clientName: 'Default Client',
            tankCode: '',
            tankDiameter: '',
            tankHeight: '',
            tankLength: '',
            tankCapacity: '',
            calibrationDate: new Date().toISOString().split('T')[0],
            calibrationCompany: '',
            heightHeader: 'Height (m)',
            volumeHeader: 'Volume (L)',
            columnOrder: 'height-volume',
            decimalPlaces: 2,
        });
    };

    const handleBack = () => {
        clearMessages();
        let previousStep;
        switch (step) {
            case Step.Configure:
                previousStep = Step.UploadChart;
                break;
            case Step.Analysis:
                previousStep = Step.Configure;
                break;
            case Step.ValidateData:
                previousStep = Step.Analysis;
                break;
            case Step.FinalReport:
                previousStep = Step.ValidateData;
                break;
            default:
                return; // No-op on first step or unknown step
        }
        setStep(previousStep);
    };
    
    const generateBaseFilename = (config: ReportConfig): string => {
        const client = config.clientName?.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-') || 'Client';
        const tank = config.tankCode?.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-') || 'Tank';
        if ((client === 'Client' || client === 'Default_Client') && tank === 'Tank') {
             return `tank_project_${new Date().toISOString().split('T')[0]}`;
        }
        return `${client}_${tank}`;
    };

    const handleSaveProject = async () => {
        clearMessages();

        const projectState: ProjectState = {
            reportConfig,
            processedData,
            validationStats,
            chartFileName: chartFile?.name || 'Untitled Project',
            deliveryValidationData,
        };
        const blob = new Blob([JSON.stringify(projectState)], { type: 'application/json' });
        
        const baseFilename = generateBaseFilename(reportConfig);
        const defaultFileName = projectFileName || `${baseFilename}.adf`;
        
        try {
            saveAs(blob, defaultFileName);
            setSuccessMessage("Project file download initiated. Please check your browser's downloads.");
        } catch (err) {
            setError("Failed to save project file.");
            console.error(err);
        }
    };

    const handleOpenProjectClick = () => {
        openProjectInputRef.current?.click();
    };
    
    const handleLoadProject = (file: File) => {
        clearMessages();
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const projectState: ProjectState = JSON.parse(event.target?.result as string);
                setReportConfig(projectState.reportConfig);
                setProcessedData(projectState.processedData);
                setValidationStats(projectState.validationStats);
                setDeliveryValidationData(projectState.deliveryValidationData || null);
                setChartFile(new File([], projectState.chartFileName));
                setProjectFileName(file.name); // Store the loaded project's filename
                setStep(Step.Analysis); // Jump to analysis after loading
            } catch (err) {
                setError('Invalid or corrupted project file.');
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setError('Failed to read the project file.');
            setIsLoading(false);
        };
        reader.readAsText(file);
    };

    const handleProjectFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleLoadProject(e.target.files[0]);
        }
    };

    const renderStep = () => {
        switch (step) {
            case Step.UploadChart:
                return (
                    <FileUpload 
                        onFileUpload={handleChartUpload}
                        title="Step 1: Upload Calibration Data"
                        description="Upload a CSV/TXT file with calibration data to begin."
                        isLoading={isLoading}
                        file={chartFile}
                        acceptedFileType=".csv,.txt"
                    />
                );
            case Step.Configure:
                return <ConfigurationForm initialConfig={reportConfig} onSubmit={handleConfigSubmit} />;
            case Step.Analysis:
                return (
                    <InitialReportView
                        data={processedData}
                        stats={validationStats}
                        config={reportConfig}
                        onNavigateToValidation={() => setStep(Step.ValidateData)}
                        onSaveProject={handleSaveProject}
                    />
                );
            case Step.ValidateData:
                return (
                    <ValidationDataInput
                        onFileUpload={handleValidationUpload}
                        onManualSubmit={handleManualValidationSubmit}
                        isLoading={isLoading}
                    />
                );
            case Step.FinalReport:
                return (
                    <ReportDashboard
                        data={processedData}
                        stats={validationStats}
                        config={reportConfig}
                        onReset={handleReset}
                        onSaveProject={handleSaveProject}
                        deliveryData={deliveryValidationData}
                    />
                );
            default:
                return <div>Unknown Step</div>;
        }
    };

    return (
        <div className="bg-slate-100 min-h-screen font-sans">
            {/* Hidden file input for opening projects */}
            <input
                type="file"
                ref={openProjectInputRef}
                onChange={handleProjectFileSelected}
                accept=".adf"
                className="sr-only"
            />

            <div className="max-w-7xl mx-auto p-4 sm:p-8">
                <MenuBar
                    onNew={handleReset}
                    onOpen={handleOpenProjectClick}
                    onSave={handleSaveProject}
                    onExport={handleSaveProject}
                    onExit={handleReset}
                    onBack={handleBack}
                    onStartOver={handleReset}
                    showNavigationButtons={step > Step.UploadChart}
                />
                <header className="text-center mb-8 relative mt-4">
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                        Tank Calibration Report Generator
                    </h1>
                    <p className="mt-2 text-lg text-slate-600">
                        Automate tank chart analysis and validation reports.
                    </p>
                </header>
                
                <main className="bg-white rounded-xl shadow-lg p-4 sm:p-8 mt-8 relative">
                    <StepIndicator currentStep={step} />
                    
                    <div className="mt-8">
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                                <p className="font-bold">An error occurred:</p>
                                <p>{error}</p>
                            </div>
                        )}
                        {successMessage && (
                             <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                                <p className="font-bold">Success!</p>
                                <p>{successMessage}</p>
                            </div>
                        )}
                        {renderStep()}
                    </div>
                </main>

                <footer className="text-center mt-8 text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Tank Calibration Solutions. All Rights Reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;