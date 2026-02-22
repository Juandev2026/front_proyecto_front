/**
 * Converts an ISO UTC string to a format compatible with <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
 * while preserving the local time representation.
 */
export const formatDateForInput = (isoString: string | undefined | null): string => {
  if (!isoString || isoString === '-') return '';
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    
    // Adjust for timezone offset to get local time in ISO format
    const offset = date.getTimezoneOffset() * 60000;
    const localISODate = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    return localISODate;
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return '';
  }
};

/**
 * Converts a local date-time string (YYYY-MM-DDTHH:mm) back to a UTC ISO string.
 */
export const parseInputDateToISO = (localString: string): string => {
  if (!localString) return '';
  
  try {
    const date = new Date(localString);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString();
  } catch (error) {
    console.error("Error parsing input date to ISO:", error);
    return '';
  }
};
