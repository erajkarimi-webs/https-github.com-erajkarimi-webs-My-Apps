import { ProcessedData, ValidationStats, ReportConfig, DeliveryValidationData } from '../types';

/**
 * Parses the text content of a calibration data file, auto-detecting the format.
 * Supports:
 *  - Standard CSV with headers (comma-separated).
 *  - Headerless CSV (comma or semicolon-separated), assumes [Height, Volume, ...].
 *  - FUSION_ATG_TANK_TABLE format (space-separated).
 * @param text The raw string content of the file.
 * @returns An object containing the parsed headers and data.
 */
const parseFileContent = (text: string): { headers: string[], data: (string|number)[][] } => {
    const trimmedText = text.trim();
    if (!trimmedText) throw new Error("File content is empty.");

    let lines = trimmedText.split(/\r?\n/);

    // 1. Handle FUSION_ATG_TANK_TABLE format
    if (lines[0].trim().toUpperCase() === '[FUSION_ATG_TANK_TABLE]') {
        if (lines.length < 3) throw new Error("Fusion ATG file must have a header and at least one data row.");
        
        const headerLine = lines[1];
        const dataLines = lines.slice(2);
        const headers = headerLine.split(/\s+/).map(h => h.trim());

        const data = dataLines.map(line => {
            const fields = line.trim().split(/\s+/);
            return fields.map(field => {
                const num = parseFloat(field.trim());
                return isNaN(num) ? field.trim() : num;
            });
        });

        return { headers, data };
    }

    // 2. Detect delimiter for other formats (CSV-like)
    let delimiter = ',';
    if (lines[0].includes(';')) {
        delimiter = ';';
    } 
    
    // 3. Check if the first line is a header or data
    const firstLineFields = lines[0].split(delimiter);
    // A line is considered a header if it contains at least one non-numeric value.
    const firstLineIsHeader = firstLineFields.some(field => isNaN(parseFloat(field.trim())));

    if (firstLineIsHeader) {
        // Standard CSV with a header row
        if (lines.length < 2) throw new Error("CSV file must have at least one data row.");
        const headers = lines[0].split(delimiter).map(h => h.trim());
        const data = lines.slice(1).map(line => {
            return line.split(delimiter).map(field => {
                const num = parseFloat(field.trim());
                return isNaN(num) ? field.trim() : num;
            });
        });
        return { headers, data };
    } else {
        // Headerless data (like the semicolon example)
        const headers = ['Height', 'Volume']; // Assume default headers
        const data = lines.map(line => {
            const fields = line.split(delimiter);
            // We are interested in the first two columns for this format.
            return fields.slice(0, 2).map(field => {
                const num = parseFloat(field.trim());
                return isNaN(num) ? field.trim() : num;
            });
        });
        if (data.length === 0) throw new Error("No data rows found in the file.");
        return { headers, data };
    }
};

const findHeaders = (headers: string[]): { heightHeader: string; volumeHeader?: string; fieldVolumeHeader?: string; deliveryHeader?: string } | null => {
    const heightRegex = /height|depth|level|dip/i;
    const volumeRegex = /volume|capacity|liters|gallons|Ltrs/i;
    const fieldVolumeRegex = /field|actual|measured|site/i;
    const deliveryRegex = /delivery|delivered|fuel delivery/i;

    const heightHeader = headers.find(h => heightRegex.test(h));
    const volumeHeader = headers.find(h => volumeRegex.test(h) && !fieldVolumeRegex.test(h)) || headers.find(h => volumeRegex.test(h));
    const fieldVolumeHeader = headers.find(h => fieldVolumeRegex.test(h) && volumeRegex.test(h));
    const deliveryHeader = headers.find(h => deliveryRegex.test(h));
    
    if (heightHeader && (volumeHeader || deliveryHeader)) {
        return { heightHeader, volumeHeader, fieldVolumeHeader, deliveryHeader };
    }
    return null;
}


const calculateStats = (data: ProcessedData[]): ValidationStats => {
    const validDeviations = data.map(d => d.deviation).filter(d => d !== undefined && d !== null && !isNaN(d)) as number[];
    const totalMeasurements = validDeviations.length;
    
    if (totalMeasurements === 0) {
        return { totalMeasurements: 0, averageDeviation: 0, maxDeviation: { height: 0, value: 0 }, minDeviation: { height: 0, value: 0 } };
    }

    const averageDeviation = validDeviations.reduce((sum, dev) => sum + dev, 0) / totalMeasurements;

    let maxDeviation: { height: number; value: number } = { height: -Infinity, value: -Infinity };
    let minDeviation: { height: number; value: number } = { height: Infinity, value: Infinity };

    data.forEach(d => {
        if (d.deviation !== undefined && d.deviation !== null && !isNaN(d.deviation)) {
            if (d.deviation > maxDeviation.value) {
                maxDeviation = { height: d.height, value: d.deviation };
            }
            if (d.deviation < minDeviation.value) {
                minDeviation = { height: d.height, value: d.deviation };
            }
        }
    });

    return { totalMeasurements, averageDeviation, maxDeviation, minDeviation };
}

export const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

// FIX: Corrected the broken function signature which was causing multiple import errors.
export const processAndAnalyzeData = async (
    fileText: string
): Promise<{ data: ProcessedData[]; stats: ValidationStats | null; initialConfig: Partial<ReportConfig> }> => {
    const { headers: headerList, data: rawData } = parseFileContent(fileText);
    const headers = findHeaders(headerList);
    
    if (!headers || !headers.volumeHeader) {
        throw new Error('Could not automatically detect "Height" and "Volume" columns. Please check the file headers or ensure the format is correct.');
    }

    const { heightHeader, volumeHeader, fieldVolumeHeader } = headers;
    const heightIndex = headerList.indexOf(heightHeader);
    const volumeIndex = headerList.indexOf(volumeHeader);
    const fieldVolumeIndex = fieldVolumeHeader ? headerList.indexOf(fieldVolumeHeader) : -1;

    const data: ProcessedData[] = rawData.map((row): ProcessedData | null => {
        const height = Number(row[heightIndex]);
        const chartVolume = Number(row[volumeIndex]);
        const fieldVolume = fieldVolumeIndex !== -1 ? Number(row[fieldVolumeIndex]) : undefined;
        
        if (isNaN(height) || isNaN(chartVolume)) return null;
        
        const deviation = (fieldVolume !== undefined && !isNaN(fieldVolume)) ? (fieldVolume - chartVolume) : undefined;

        return { height, chartVolume, fieldVolume, deviation };
    }).filter((d): d is ProcessedData => d !== null);

    if (data.length === 0) throw new Error('No valid numeric data found.');
    
    const initialConfig: Partial<ReportConfig> = { heightHeader, volumeHeader, columnOrder: 'height-volume', decimalPlaces: 2 };
    const stats: ValidationStats | null = fieldVolumeHeader ? calculateStats(data) : null;
    
    return { data, stats, initialConfig };
};


const interpolate = (height: number, chartData: ProcessedData[]): number => {
    const sortedChart = [...chartData].sort((a, b) => a.height - b.height);
    const upper = sortedChart.find(p => p.height >= height);
    const lower = [...sortedChart].reverse().find(p => p.height <= height);

    if (!upper || !lower) return sortedChart[0]?.chartVolume || 0; // Extrapolate or default
    if (upper.height === lower.height) return upper.chartVolume;

    const slope = (upper.chartVolume - lower.chartVolume) / (upper.height - lower.height);
    return lower.chartVolume + slope * (height - lower.height);
};

export const generateStrappingChartData = (chartData: ProcessedData[], points: number = 300): ProcessedData[] => {
    if (chartData.length < 2) return chartData;

    const sortedChart = [...chartData].sort((a, b) => a.height - b.height);
    const minHeight = sortedChart[0].height;
    const maxHeight = sortedChart[sortedChart.length - 1].height;
    
    const step = (maxHeight - minHeight) / (points - 1);
    const strappingData: ProcessedData[] = [];

    for (let i = 0; i < points; i++) {
        const currentHeight = minHeight + (i * step);
        const currentVolume = interpolate(currentHeight, chartData);
        strappingData.push({ height: currentHeight, chartVolume: currentVolume });
    }
    
    return strappingData;
};

const processPointValidation = (
    validationFileText: string,
    chartData: ProcessedData[]
): { combinedData: ProcessedData[], stats: ValidationStats } => {
    const { headers: headerList, data: rawData } = parseFileContent(validationFileText);
    const headers = findHeaders(headerList);

    if (!headers || !headers.volumeHeader) {
        throw new Error('Validation file must have "Height" and "Volume" columns.');
    }

    const heightIndex = headerList.indexOf(headers.heightHeader);
    const volumeIndex = headerList.indexOf(headers.volumeHeader);

    const validationPoints = rawData.map(row => ({
        height: Number(row[heightIndex]),
        fieldVolume: Number(row[volumeIndex]),
    })).filter(p => !isNaN(p.height) && !isNaN(p.fieldVolume));

    if (validationPoints.length === 0) {
        throw new Error("No valid validation data points found in the file.");
    }

    const combinedData: ProcessedData[] = validationPoints.map(vp => {
        const chartVolume = interpolate(vp.height, chartData);
        return {
            height: vp.height,
            chartVolume: chartVolume,
            fieldVolume: vp.fieldVolume,
            deviation: vp.fieldVolume - chartVolume,
        }
    });
    
    const stats = calculateStats(combinedData);

    return { combinedData, stats };
};

export const calculateDeliveryValidation = (
    deliveryPoints: { height: number; delivery: number }[],
    chartData: ProcessedData[]
): { deliveryData: DeliveryValidationData[], stats: ValidationStats } => {

    const deliveryData: DeliveryValidationData[] = [];
    for (let i = 1; i < deliveryPoints.length; i++) {
        const heightBefore = deliveryPoints[i - 1].height;
        const heightAfter = deliveryPoints[i].height;
        const reportedDelivery = deliveryPoints[i].delivery;

        if (reportedDelivery === 0 && i > 0) continue; // Skip entries with 0 delivery unless it's the very first reading

        const volumeBefore = interpolate(heightBefore, chartData);
        const volumeAfter = interpolate(heightAfter, chartData);

        const chartCalculatedDelivery = volumeAfter - volumeBefore;

        deliveryData.push({
            heightBefore,
            heightAfter,
            reportedDelivery,
            chartCalculatedDelivery,
            deviation: reportedDelivery - chartCalculatedDelivery,
        });
    }

    const totalDeliveries = deliveryData.length;
    if (totalDeliveries === 0) {
        return { deliveryData: [], stats: { totalMeasurements: 0, averageDeviation: 0, maxDeviation: { height: 0, value: 0 }, minDeviation: { height: 0, value: 0 } } };
    }

    const deviations = deliveryData.map(d => d.deviation);
    const averageDeviation = deviations.reduce((a, b) => a + b, 0) / totalDeliveries;

    let maxDeviation = { height: -1, value: -Infinity };
    let minDeviation = { height: -1, value: Infinity };

    deliveryData.forEach(d => {
        if (d.deviation > maxDeviation.value) maxDeviation = { height: d.heightAfter, value: d.deviation };
        if (d.deviation < minDeviation.value) minDeviation = { height: d.heightAfter, value: d.deviation };
    });

    return { deliveryData, stats: { totalMeasurements: totalDeliveries, averageDeviation, maxDeviation, minDeviation } };
};

const processDeliveryValidation = (
    validationFileText: string,
    chartData: ProcessedData[]
): { deliveryData: DeliveryValidationData[], stats: ValidationStats } => {
    const { headers: headerList, data: rawData } = parseFileContent(validationFileText);
    const headers = findHeaders(headerList);

    if (!headers || !headers.deliveryHeader) {
        throw new Error('Delivery validation file must have "Height" and "Fuel Delivery" columns.');
    }

    const heightIndex = headerList.indexOf(headers.heightHeader);
    const deliveryIndex = headerList.indexOf(headers.deliveryHeader);

    const deliveryPoints = rawData.map(row => ({
        height: Number(row[heightIndex]),
        delivery: Number(row[deliveryIndex]),
    })).filter(p => !isNaN(p.height) && !isNaN(p.delivery));

    if (deliveryPoints.length < 2) {
        throw new Error("Delivery validation requires at least two data points (e.g., before and after delivery).");
    }

    return calculateDeliveryValidation(deliveryPoints, chartData);
};

export const processValidationData = async (
    validationFileText: string,
    chartData: ProcessedData[]
): Promise<{
    type: 'point_validation',
    combinedData: ProcessedData[],
    stats: ValidationStats
} | {
    type: 'delivery_validation',
    deliveryData: DeliveryValidationData[],
    stats: ValidationStats
}> => {
    const { headers: headerList } = parseFileContent(validationFileText);
    const headers = findHeaders(headerList);

    if (headers?.deliveryHeader) {
        const result = processDeliveryValidation(validationFileText, chartData);
        return { type: 'delivery_validation', ...result };
    }
    
    if (headers?.volumeHeader) {
        const result = processPointValidation(validationFileText, chartData);
        return { type: 'point_validation', ...result };
    }
    
    throw new Error("Could not determine validation file type. Please ensure headers like 'Volume' or 'Fuel Delivery' are present.");
};