import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file (.xlsx)
 * @param data Array of objects to export
 * @param fileName Name of the file (without extension)
 * @param sheetName Name of the sheet
 * @param header Custom headers for the columns
 */
export const exportToExcel = (
  data: any[],
  fileName: string,
  sheetName: string = 'Reporte',
  header?: string[]
) => {
  const worksheet = XLSX.utils.json_to_sheet(data, { header });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Create the Excel file
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Formats a date string to a more readable format for the Excel report
 */
export const formatDateForExcel = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '-';
  }
};
