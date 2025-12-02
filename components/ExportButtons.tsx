'use client';

import { useState } from 'react';
import { 
  exportTasksToPDF, 
  exportTasksToExcel,
  exportReportsToPDF,
  exportReportsToExcel 
} from '@/lib/exportUtils';

interface ExportButtonsProps {
  data: any[];
  type: 'tasks' | 'reports' | 'users';
  className?: string;
}

export default function ExportButtons({ data, type, className = '' }: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (type === 'tasks') {
        exportTasksToPDF(data, `tasks-${timestamp}.pdf`);
      } else if (type === 'reports') {
        exportReportsToPDF(data, `reports-${timestamp}.pdf`);
      }
      
      alert('Xuất PDF thành công!');
    } catch (error) {
      console.error('Export PDF error:', error);
      alert('Có lỗi khi xuất PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (type === 'tasks') {
        exportTasksToExcel(data, `tasks-${timestamp}.xlsx`);
      } else if (type === 'reports') {
        exportReportsToExcel(data, `reports-${timestamp}.xlsx`);
      }
      
      alert('Xuất Excel thành công!');
    } catch (error) {
      console.error('Export Excel error:', error);
      alert('Có lỗi khi xuất Excel');
    } finally {
      setExporting(false);
    }
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={handleExportPDF}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span>{exporting ? 'Đang xuất...' : 'Xuất PDF'}</span>
      </button>

      <button
        onClick={handleExportExcel}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{exporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
      </button>
    </div>
  );
}
