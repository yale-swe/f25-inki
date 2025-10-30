// Client-side pdf parser
// Extracts text using pdf.js

import { DocumentParseResult } from '@/lib/types/document';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
let pdfjs: any = null;
if (typeof window !== 'undefined') {
  pdfjs = require('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
export async function parsePdfFile(file: File): Promise<DocumentParseResult> {
  try {
    if (typeof window === 'undefined' || !pdfjs) {
      return {
        text: '',
        pageCount: 0,
        success: false,
        error: 'PDF parsing is only available on the client side'};
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const pageCount = pdf.numPages;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const itemsByLine: Map<number, any[]> = new Map();
        textContent.items.forEach((item: any) => {
          if (!item.str || !item.transform) return;
          const y = Math.round(item.transform[5]);
          if (!itemsByLine.has(y)) {
            itemsByLine.set(y, []);
          }
          itemsByLine.get(y)!.push(item);
        });

        const sortedLines = Array.from(itemsByLine.entries())
          .sort((a, b) => b[0] - a[0]);

        let lastY = sortedLines[0]?.[0] || 0;
        sortedLines.forEach(([y, items]) => {
          items.sort((a, b) => a.transform[4] - b.transform[4]);
          let lineText = '';
          items.forEach((item, index) => {
            if (index === 0) {
              lineText = item.str;
            } else {
              const prevItem = items[index - 1];
              const gap = item.transform[4] - (prevItem.transform[4] + (prevItem.width || 0));
              if (gap < 1) {
                lineText += item.str;
              } else {
                lineText += ' ' + item.str;
              }
            }
          });

          lineText = lineText
            .replace(/\s+/g, ' ')
            .trim();
          if (!lineText) return;

          const gap = Math.abs(lastY - y);
          if (gap > 15 && fullText.length > 0) {
            fullText += '\n\n';
          } else if (fullText.length > 0) {
            fullText += '\n';
          }
          fullText += lineText;
          lastY = y;
        });

        fullText += '\n\n';
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        fullText += `\n\n[Error processing page ${pageNum}]\n\n`;
      }
    }

    return {
      text: fullText.trim(),
      pageCount,
      success: true
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function parseTextFile(file: File): Promise<DocumentParseResult> {
  try {
    const text = await file.text();
    return {
      text: text.trim(),
      pageCount: 1,
      success: true
    };
  } catch (error) {
    console.error('Error parsing text file:', error);
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function parseDocument(file: File): Promise<DocumentParseResult> {
  if (typeof window === 'undefined') {
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: 'Document parsing is only available on the client side'
    };
  }

  const mimeType = file.type;
  
  if (mimeType === 'application/pdf') {
    return parsePdfFile(file);
  } else if (mimeType === 'text/plain' || mimeType === 'text/txt') {
    return parseTextFile(file);
  } else {
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: `Unsupported file type: ${mimeType}`
    };
  }
}
