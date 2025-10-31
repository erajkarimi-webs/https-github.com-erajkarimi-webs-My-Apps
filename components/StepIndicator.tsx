import React from 'react';
import { Step as StepEnum } from '../types';

interface StepIndicatorProps {
    currentStep: StepEnum;
}

const Step: React.FC<{ icon: string; label: string; isCurrent: boolean; isCompleted: boolean }> = ({ icon, label, isCurrent, isCompleted }) => {
    return (
        <div className="flex items-center flex-col sm:flex-row flex-1 text-center sm:text-left">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors text-lg ${isCurrent ? 'bg-indigo-600 ring-4 ring-indigo-200' : isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}>
                {isCompleted && !isCurrent ? (
                    '✔'
                ) : icon}
            </div>
            <span className={`ml-0 sm:ml-3 mt-2 sm:mt-0 text-sm font-medium transition-colors ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-gray-700' : 'text-gray-500'}`}>{label}</span>
        </div>
    );
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    
    // Map the enum to a linear step number for progress tracking
    const getStepNumber = (step: StepEnum): number => {
        switch(step) {
            case StepEnum.UploadChart: return 1;
            case StepEnum.Configure: return 2;
            case StepEnum.Analysis: return 3;
            case StepEnum.ValidateData: return 4;
            case StepEnum.FinalReport: return 5;
            default: return 0;
        }
    }
    
    const currentStepNumber = getStepNumber(currentStep);

    const steps = [
        { step: 1, icon: '1', label: 'Upload Chart' },
        { step: 2, icon: '2', label: 'Configure' },
        { step: 3, icon: '3', label: 'Analysis & Next Steps' },
        { step: 4, icon: '4', label: 'Validate Data' },
        { step: 5, icon: '5', label: 'Final Report' },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto mb-8">
            <div className="flex items-start">
                {steps.map((s, index) => (
                    <React.Fragment key={s.step}>
                        <Step
                            icon={s.icon}
                            label={s.label}
                            isCurrent={currentStepNumber === s.step}
                            isCompleted={currentStepNumber > s.step}
                        />
                        {index < steps.length - 1 && <div className={`flex-auto border-t-2 transition-colors mx-4 mt-5 ${currentStepNumber > s.step ? 'border-green-500' : 'border-gray-200'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default StepIndicator;