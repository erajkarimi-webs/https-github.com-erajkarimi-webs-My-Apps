

export enum Step {
    UploadChart = 1,
    Configure,
    Analysis,
    ValidateData,
    FinalReport,
}

export interface ReportConfig {
    clientName: string;
    tankCode: string;
    tankDiameter: string;
    tankHeight: string;
    tankLength: string;
    tankCapacity: string;
    calibrationDate: string;
    calibrationCompany: string;
    heightHeader: string;
    volumeHeader: string;
    columnOrder: 'height-volume' | 'volume-height';
    decimalPlaces: number;
}

export interface ProcessedData {
    height: number;
    chartVolume: number;
    fieldVolume?: number;
    deviation?: number;
}

export interface DeviationPoint {
    height: number;
    value: number;
}

export interface ValidationStats {
    totalMeasurements: number;
    averageDeviation: number;
    maxDeviation: DeviationPoint;
    minDeviation: DeviationPoint;
}

export interface DeliveryValidationData {
    heightBefore: number;
    heightAfter: number;
    reportedDelivery: number;
    chartCalculatedDelivery: number;
    deviation: number;
}

export interface ProjectState {
    reportConfig: ReportConfig;
    processedData: ProcessedData[];
    validationStats: ValidationStats | null;
    chartFileName: string;
    deliveryValidationData?: DeliveryValidationData[] | null;
}