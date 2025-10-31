import {
  formatFileSize,
  formatDate,
  formatDateShort,
  getStatusColor
} from './helpers';

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('should handle null and zero values', () => {
    expect(formatFileSize(null)).toBe('Unknown size');
    expect(formatFileSize(0)).toBe('Unknown size');
  });

  it('should round to 2 decimal places', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1587)).toBe('1.55 KB');
  });
});

describe('formatDate', () => {
  it('should format date with full month name', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});

describe('formatDateShort', () => {
  it('should format date with short month name', () => {
    const result = formatDateShort('2024-01-15T10:30:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});

describe('getStatusColor', () => {
  it('should return correct color for ready status', () => {
    expect(getStatusColor('ready')).toBe('bg-green-100 text-green-800');
  });
  it('should return correct color for processing status', () => {
    expect(getStatusColor('processing')).toBe('bg-yellow-100 text-yellow-800');
  });

  it('should return correct color for error status', () => {
    expect(getStatusColor('error')).toBe('bg-red-100 text-red-800');
  });

  it('should return default color for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('bg-gray-100 text-gray-800');
  });
});
