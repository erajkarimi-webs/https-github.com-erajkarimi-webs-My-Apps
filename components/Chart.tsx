import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ProcessedData, ReportConfig } from '../types';

declare const Chart: any; // Using Chart.js from CDN

interface ChartComponentProps {
    data: ProcessedData[];
    config: ReportConfig;
    xAxisLabel?: string;
    yAxisLabel?: string;
    font?: string;
    fontSize?: number;
}

export interface ChartRef {
    getChartInstance: () => any;
}

const ChartComponent = forwardRef<ChartRef, ChartComponentProps>(({ data, config, xAxisLabel, yAxisLabel, font, fontSize }, ref) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        getChartInstance: () => {
            return chartInstance.current;
        }
    }));

    useEffect(() => {
        if (chartRef.current && data.length > 0) {
            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;

            // Destroy previous chart instance if it exists
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const labels = data.map(d => d.height.toFixed(config.decimalPlaces));
            const chartData = data.map(d => d.chartVolume.toFixed(config.decimalPlaces));
            
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(79, 70, 229, 0.5)');
            gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: config.volumeHeader,
                        data: chartData,
                        borderColor: 'rgba(79, 70, 229, 1)',
                        backgroundColor: gradient,
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: xAxisLabel || config.heightHeader,
                                font: {
                                    family: font || 'sans-serif',
                                    size: fontSize || 12,
                                }
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: yAxisLabel || config.volumeHeader,
                                font: {
                                    family: font || 'sans-serif',
                                    size: fontSize || 12,
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
        }

        // Cleanup on unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, config, xAxisLabel, yAxisLabel, font, fontSize]);

    return (
        <div style={{ position: 'relative', height: '40vh' }}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
});

export default ChartComponent;