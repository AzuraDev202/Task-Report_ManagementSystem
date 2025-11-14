import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportTasksToPDF = (tasks: any[], filename = 'tasks.pdf') => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text('Danh sách Công việc', 14, 22);

  // Add date
  doc.setFontSize(11);
  doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 14, 30);

  // Prepare table data
  const tableData = tasks.map((task, index) => [
    index + 1,
    task.title,
    task.assignedTo?.name || 'N/A',
    task.status,
    task.priority,
    new Date(task.dueDate).toLocaleDateString('vi-VN'),
  ]);

  // Add table
  autoTable(doc, {
    startY: 35,
    head: [['STT', 'Tiêu đề', 'Người nhận', 'Trạng thái', 'Ưu tiên', 'Hạn chót']],
    body: tableData,
    styles: {
      font: 'helvetica',
      fontSize: 10,
    },
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
    },
  });

  doc.save(filename);
};

export const exportTasksToExcel = (tasks: any[], filename = 'tasks.xlsx') => {
  const data = tasks.map((task, index) => ({
    'STT': index + 1,
    'Tiêu đề': task.title,
    'Mô tả': task.description,
    'Người nhận': task.assignedTo?.name || 'N/A',
    'Người giao': task.assignedBy?.name || 'N/A',
    'Trạng thái': task.status,
    'Ưu tiên': task.priority,
    'Hạn chót': new Date(task.dueDate).toLocaleDateString('vi-VN'),
    'Ngày tạo': new Date(task.createdAt).toLocaleDateString('vi-VN'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },  // STT
    { wch: 30 }, // Tiêu đề
    { wch: 40 }, // Mô tả
    { wch: 20 }, // Người nhận
    { wch: 20 }, // Người giao
    { wch: 15 }, // Trạng thái
    { wch: 12 }, // Ưu tiên
    { wch: 12 }, // Hạn chót
    { wch: 12 }, // Ngày tạo
  ];

  XLSX.writeFile(wb, filename);
};

export const exportReportsToPDF = (reports: any[], filename = 'reports.pdf') => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Danh sách Báo cáo', 14, 22);

  doc.setFontSize(11);
  doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 14, 30);

  const tableData = reports.map((report, index) => [
    index + 1,
    report.title,
    report.task?.title || 'N/A',
    report.user?.name || 'N/A',
    report.status,
    new Date(report.createdAt).toLocaleDateString('vi-VN'),
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['STT', 'Tiêu đề', 'Công việc', 'Người tạo', 'Trạng thái', 'Ngày tạo']],
    body: tableData,
    styles: {
      font: 'helvetica',
      fontSize: 10,
    },
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
    },
  });

  doc.save(filename);
};

export const exportReportsToExcel = (reports: any[], filename = 'reports.xlsx') => {
  const data = reports.map((report, index) => ({
    'STT': index + 1,
    'Tiêu đề': report.title,
    'Nội dung': report.content,
    'Công việc': report.task?.title || 'N/A',
    'Người tạo': report.user?.name || 'N/A',
    'Trạng thái': report.status,
    'Ngày tạo': new Date(report.createdAt).toLocaleDateString('vi-VN'),
    'Ngày nộp': report.submittedDate ? new Date(report.submittedDate).toLocaleDateString('vi-VN') : 'N/A',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reports');

  ws['!cols'] = [
    { wch: 5 },  // STT
    { wch: 30 }, // Tiêu đề
    { wch: 50 }, // Nội dung
    { wch: 30 }, // Công việc
    { wch: 20 }, // Người tạo
    { wch: 15 }, // Trạng thái
    { wch: 12 }, // Ngày tạo
    { wch: 12 }, // Ngày nộp
  ];

  XLSX.writeFile(wb, filename);
};

export const exportUsersToPDF = (users: any[], filename = 'users.pdf') => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Danh sách Người dùng', 14, 22);

  doc.setFontSize(11);
  doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 14, 30);

  const tableData = users.map((user, index) => [
    index + 1,
    user.name,
    user.email,
    user.role,
    user.department || 'N/A',
    user.position || 'N/A',
    user.isActive ? 'Hoạt động' : 'Không hoạt động',
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['STT', 'Họ tên', 'Email', 'Vai trò', 'Phòng ban', 'Chức vụ', 'Trạng thái']],
    body: tableData,
    styles: {
      font: 'helvetica',
      fontSize: 10,
    },
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
    },
  });

  doc.save(filename);
};

export const exportUsersToExcel = (users: any[], filename = 'users.xlsx') => {
  const data = users.map((user, index) => ({
    'STT': index + 1,
    'Họ tên': user.name,
    'Email': user.email,
    'Vai trò': user.role,
    'Phòng ban': user.department || 'N/A',
    'Chức vụ': user.position || 'N/A',
    'Trạng thái': user.isActive ? 'Hoạt động' : 'Không hoạt động',
    'Ngày tạo': new Date(user.createdAt).toLocaleDateString('vi-VN'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Users');

  ws['!cols'] = [
    { wch: 5 },  // STT
    { wch: 25 }, // Họ tên
    { wch: 30 }, // Email
    { wch: 12 }, // Vai trò
    { wch: 20 }, // Phòng ban
    { wch: 20 }, // Chức vụ
    { wch: 15 }, // Trạng thái
    { wch: 12 }, // Ngày tạo
  ];

  XLSX.writeFile(wb, filename);
};
