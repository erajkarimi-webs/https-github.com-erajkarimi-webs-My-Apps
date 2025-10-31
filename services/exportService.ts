import { ProcessedData, ReportConfig, ValidationStats } from '../types';
import { generateStrappingChartData } from './dataProcessor';

declare const jsPDF: any;
declare const XLSX: any;
declare const saveAs: any;

const generateBaseFilename = (config: ReportConfig): string => {
    const client = config.clientName?.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-') || 'Client';
    const tank = config.tankCode?.replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '-') || 'Tank';
    if ((client === 'Client' || client === 'Default_Client') && tank === 'Tank') {
        return 'Untitled';
    }
    return `${client}_${tank}`;
};

const generateHeaders = (config: ReportConfig, hasValidationData: boolean): string[] => {
    const headers = [];
    if (config.columnOrder === 'height-volume') {
        headers.push(config.heightHeader);
        headers.push(hasValidationData ? `Chart ${config.volumeHeader}` : config.volumeHeader);
    } else {
        headers.push(hasValidationData ? `Chart ${config.volumeHeader}` : config.volumeHeader);
        headers.push(config.heightHeader);
    }
    if (hasValidationData) {
        headers.push(`Field ${config.volumeHeader}`);
        headers.push('Deviation');
    }
    return headers;
};

const generateRows = (data: ProcessedData[], config: ReportConfig, hasValidationData: boolean): (string | number)[][] => {
    return data.map(row => {
        const height = row.height.toFixed(config.decimalPlaces);
        const chartVolume = row.chartVolume.toFixed(config.decimalPlaces);
        
        const rowData: (string|number)[] = [];
        if (config.columnOrder === 'height-volume') {
            rowData.push(height, chartVolume);
        } else {
            rowData.push(chartVolume, height);
        }
        
        if (hasValidationData) {
            rowData.push(row.fieldVolume !== undefined ? row.fieldVolume.toFixed(config.decimalPlaces) : 'N/A');
            rowData.push(row.deviation !== undefined ? row.deviation.toFixed(config.decimalPlaces) : 'N/A');
        }
        
        return rowData;
    });
};

export const exportToPDF = (data: ProcessedData[], config: ReportConfig, title: string, stats: ValidationStats | null, filename?: string) => {
    const doc = new (window as any).jspdf.jsPDF();
    const hasValidationData = !!stats;
    let startY = 22;

    doc.setFontSize(18);
    doc.text(title, 14, startY);
    startY += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    const configDetails = [
        `Client: ${config.clientName}`,
        `Tank: ${config.tankCode || 'N/A'}`,
        `Date: ${config.calibrationDate || 'N/A'}`,
    ];
    
    doc.text(configDetails.join(' | '), 14, startY);
    startY += 15;

    if (stats) {
        doc.setFontSize(12);
        doc.text("Validation Summary", 14, startY);
        startY += 7;
        const statsData = [
            ["Total Measurements:", stats.totalMeasurements],
            ["Average Deviation:", stats.averageDeviation.toFixed(config.decimalPlaces)],
            ["Max Positive Deviation:", `+${stats.maxDeviation.value.toFixed(config.decimalPlaces)} (at ${stats.maxDeviation.height}m)`],
            ["Max Negative Deviation:", `${stats.minDeviation.value.toFixed(config.decimalPlaces)} (at ${stats.minDeviation.height}m)`],
        ];
        (doc as any).autoTable({
            startY,
            body: statsData,
            theme: 'grid',
        });
        startY = (doc as any).lastAutoTable.finalY + 10;
    }

    const headers = generateHeaders(config, hasValidationData);
    const body = generateRows(data, config, hasValidationData);

    (doc as any).autoTable({
        startY,
        head: [headers],
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
    });

    const finalFilename = filename || `${title.toLowerCase().replace(/\s/g, '_')}.pdf`;
    doc.save(finalFilename);
};

export const exportToExcel = (data: ProcessedData[], config: ReportConfig, filename: string, stats: ValidationStats | null) => {
    const hasValidationData = !!stats;
    const headers = generateHeaders(config, hasValidationData);
    const rows = generateRows(data, config, hasValidationData);
    const worksheetData = [headers, ...rows];
    
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report Data');

    if (stats) {
        const statsData = [
            ["Validation Summary"], [],
            ["Total Measurements", stats.totalMeasurements],
            ["Average Deviation", stats.averageDeviation.toFixed(config.decimalPlaces)],
            ["Max Positive Deviation", `+${stats.maxDeviation.value.toFixed(config.decimalPlaces)} (at ${stats.maxDeviation.height}m)`],
            ["Max Negative Deviation", `${stats.minDeviation.value.toFixed(config.decimalPlaces)} (at ${stats.minDeviation.height}m)`],
        ];
        const statsWs = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');
    }

    XLSX.writeFile(wb, filename);
};

// Strapping Chart Exports

const generateFormattedHeaderData = (config: ReportConfig): string[][] => {
    return [
        ['Client:', config.clientName || '', 'Contractor:', config.calibrationCompany || 'N/A'],
        ['Tank:', config.tankCode || 'N/A', 'Tank Dia (mm):', config.tankDiameter || 'N/A'],
        ['Tank Height (mm):', config.tankHeight || 'N/A', 'Tank Capacity (L):', config.tankCapacity || 'N/A'],
        ['Tank Code:', config.tankCode || 'N/A', 'Date of Calib:', config.calibrationDate || 'N/A'],
    ];
};

const reshapeStrappingData = (
    strappingData: ProcessedData[],
    numColumnPairs: number,
    formatter: (n: number) => string | number
): (string | number)[][] => {
    const rowsPerColumn = Math.ceil(strappingData.length / numColumnPairs);
    const tableBody: (string | number)[][] = [];

    for (let i = 0; i < rowsPerColumn; i++) {
        const row: (string | number)[] = [];
        for (let j = 0; j < numColumnPairs; j++) {
            const dataIndex = i + j * rowsPerColumn;
            if (dataIndex < strappingData.length) {
                const point = strappingData[dataIndex];
                row.push(formatter(point.height));
                row.push(formatter(point.chartVolume));
            } else {
                row.push('');
                row.push('');
            }
        }
        tableBody.push(row);
    }
    return tableBody;
};

export const exportStrappingChartToPDF = (data: ProcessedData[], config: ReportConfig) => {
    const doc = new (window as any).jspdf.jsPDF('p', 'mm', 'a4');
    const strappingData = generateStrappingChartData(data);
    const usableWidth = 190; // A4 width 210mm - 20mm margins

    const headerBody = generateFormattedHeaderData(config).map(row => {
        return [
            { content: row[0], styles: { fontStyle: 'bold' } },
            row[1],
            { content: row[2], styles: { fontStyle: 'bold' } },
            row[3],
        ];
    });

    (doc as any).autoTable({
        startY: 10,
        body: headerBody,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 60 },
            2: { cellWidth: 35 },
            3: { cellWidth: 60 },
        }
    });

    const headerFinalY = (doc as any).lastAutoTable.finalY;

    const numColumnPairs = 6;
    const heightUnit = config.heightHeader.match(/\(([^)]+)\)/)?.[1] || 'mm';
    const volumeUnit = config.volumeHeader.match(/\(([^)]+)\)/)?.[1] || 'L';
    const heightHeader = `H(${heightUnit})`;
    const volumeHeader = `Vol(${volumeUnit})`;
    
    const tableHeaders = Array(numColumnPairs).fill([heightHeader, volumeHeader]).flat();
    
    const pdfFormatter = (n: number): string => n.toFixed(config.decimalPlaces);
    const tableBody = reshapeStrappingData(strappingData, numColumnPairs, pdfFormatter);

    (doc as any).autoTable({
        head: [tableHeaders],
        body: tableBody,
        startY: headerFinalY,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1, overflow: 'hidden' },
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 7, halign: 'center' },
        columnStyles: Array(12).fill({ cellWidth: usableWidth / 12 }).reduce((acc, style, i) => ({ ...acc, [i]: style }), {}),
    });

    const baseFilename = generateBaseFilename(config);
    doc.save(`strapping_chart_${baseFilename}.pdf`);
};

export const exportStrappingChartToExcel = (data: ProcessedData[], config: ReportConfig) => {
    const strappingData = generateStrappingChartData(data);
    const wb = XLSX.utils.book_new();
    
    const excelHeaderRows: any[][] = [];
    generateFormattedHeaderData(config).forEach(row => {
        const sparseRow = Array(12).fill(null);
        sparseRow[0] = row[0];
        sparseRow[1] = row[1];
        sparseRow[6] = row[2];
        sparseRow[7] = row[3];
        excelHeaderRows.push(sparseRow);
    });

    const numColumnPairs = 6;
    const heightUnit = config.heightHeader.match(/\(([^)]+)\)/)?.[1] || 'mm';
    const volumeUnit = config.volumeHeader.match(/\(([^)]+)\)/)?.[1] || 'L';
    const heightHeader = `H(${heightUnit})`;
    const volumeHeader = `Vol(${volumeUnit})`;
    const tableHeaders = Array(numColumnPairs).fill([heightHeader, volumeHeader]).flat();

    const excelFormatter = (n: number): number => Math.round(n);
    const tableBody = reshapeStrappingData(strappingData, numColumnPairs, excelFormatter);

    const ws_data = [
        ...excelHeaderRows, // Rows 1-4
        tableHeaders,       // Row 5
        ...tableBody        // Rows 6-55
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    ws['!merges'] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: 5 } }, { s: { r: 0, c: 7 }, e: { r: 0, c: 11 } },
        { s: { r: 1, c: 1 }, e: { r: 1, c: 5 } }, { s: { r: 1, c: 7 }, e: { r: 1, c: 11 } },
        { s: { r: 2, c: 1 }, e: { r: 2, c: 5 } }, { s: { r: 2, c: 7 }, e: { r: 2, c: 11 } },
        { s: { r: 3, c: 1 }, e: { r: 3, c: 5 } }, { s: { r: 3, c: 7 }, e: { r: 3, c: 11 } },
    ];
    
    ws['!cols'] = Array(12).fill({ wch: 10 });

    XLSX.utils.book_append_sheet(wb, ws, 'Strapping Chart');

    const baseFilename = generateBaseFilename(config);
    XLSX.writeFile(wb, `strapping_chart_${baseFilename}.xlsx`);
};

export const exportStrappingChartToWord = (data: ProcessedData[], config: ReportConfig) => {
    const strappingData = generateStrappingChartData(data);

    const headerHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; border: none;">
            ${generateFormattedHeaderData(config).map(row => `
                <tr>
                    <td style="font-weight: bold; padding: 2px; width: 15%;">${row[0]}</td>
                    <td style="padding: 2px; width: 35%;">${row[1]}</td>
                    <td style="font-weight: bold; padding: 2px; width: 15%;">${row[2]}</td>
                    <td style="padding: 2px; width: 35%;">${row[3]}</td>
                </tr>
            `).join('')}
        </table>
    `;

    const numColumnPairs = 6;
    const heightUnit = config.heightHeader.match(/\(([^)]+)\)/)?.[1] || 'mm';
    const volumeUnit = config.volumeHeader.match(/\(([^)]+)\)/)?.[1] || 'L';
    const heightHeader = `H(${heightUnit})`;
    const volumeHeader = `Vol(${volumeUnit})`;
    
    const tableHeadersHtml = '<tr>' + 
        Array(numColumnPairs).fill(
            `<th style="border: 1px solid #000; padding: 2px; background-color:#f2f2f2; width: 8.33%;">${heightHeader}</th>` +
            `<th style="border: 1px solid #000; padding: 2px; background-color:#f2f2f2; width: 8.33%;">${volumeHeader}</th>`
        ).join('') +
    '</tr>';

    const wordFormatter = (n: number): string => String(Math.round(n));
    const tableBody = reshapeStrappingData(strappingData, numColumnPairs, wordFormatter);
    const tableBodyHtml = tableBody.map(row => `
        <tr>
            ${row.map(cell => `<td style="border: 1px solid #000; padding: 2px; text-align: right;">${cell}</td>`).join('')}
        </tr>
    `).join('');

    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page { size: A4 portrait; margin: 1.5cm; }
                body { font-family: Calibri, sans-serif; font-size: 10pt; }
                table { border-collapse: collapse; width: 100%; }
            </style>
        </head>
        <body>
            ${headerHtml}
            <br/>
            <table style="font-size: 8pt; text-align: right;">
                <thead>
                    ${tableHeadersHtml}
                </thead>
                <tbody>
                    ${tableBodyHtml}
                </tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
    const baseFilename = generateBaseFilename(config);
    saveAs(blob, `strapping_chart_${baseFilename}.doc`);
};