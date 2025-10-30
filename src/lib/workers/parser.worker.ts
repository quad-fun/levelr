// src/lib/workers/parser.worker.ts

import type { CsiLine } from '@/types/analysis';

interface ParseMessage {
  type: 'parse';
  file: File;
  runId: string;
}

interface ProgressMessage {
  type: 'progress';
  stage: 'reading' | 'parsing' | 'normalizing' | 'extracting' | 'complete';
  progress: number; // 0-1
  message: string;
  runId: string;
}

interface ChunkMessage {
  type: 'chunk';
  lines: CsiLine[];
  runId: string;
}

interface CompleteMessage {
  type: 'complete';
  lines: CsiLine[];
  metadata: {
    totalPages: number;
    fileSize: number;
    fileName: string;
    parseTime: number;
  };
  runId: string;
}

interface ErrorMessage {
  type: 'error';
  error: string;
  runId: string;
}

type WorkerMessage = ProgressMessage | ChunkMessage | CompleteMessage | ErrorMessage;

/**
 * Browser-only document parser
 * Uses PDF.js and xlsx libraries without network calls
 */
class DocumentParser {
  private runId: string = '';

  private postMessage(message: WorkerMessage) {
    self.postMessage(message);
  }

  private postProgress(stage: ProgressMessage['stage'], progress: number, message: string) {
    this.postMessage({
      type: 'progress',
      stage,
      progress,
      message,
      runId: this.runId
    });
  }

  async parseFile(file: File, runId: string): Promise<void> {
    this.runId = runId;
    const startTime = performance.now();

    try {
      this.postProgress('reading', 0.1, 'Reading file...');

      let lines: CsiLine[];

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        lines = await this.parsePdf(file);
      } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        lines = await this.parseSpreadsheet(file);
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      const parseTime = performance.now() - startTime;

      this.postMessage({
        type: 'complete',
        lines,
        metadata: {
          totalPages: Math.max(...lines.map(l => l.pageRef || 1)),
          fileSize: file.size,
          fileName: file.name,
          parseTime
        },
        runId
      });

    } catch (error) {
      this.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        runId
      });
    }
  }

  private async parsePdf(_file: File): Promise<CsiLine[]> {
    this.postProgress('parsing', 0.2, 'Loading PDF...');

    // Note: In a real implementation, you'd import PDF.js here
    // For now, we'll simulate PDF parsing with a mock implementation
    const lines: CsiLine[] = [];

    // Mock PDF parsing - replace with actual PDF.js implementation
    this.postProgress('parsing', 0.5, 'Extracting text from PDF pages...');

    // Simulate processing pages
    for (let page = 1; page <= 5; page++) {
      this.postProgress('extracting', 0.5 + (page / 5) * 0.3, `Processing page ${page}...`);

      // Mock CSI line extraction
      lines.push({
        id: `pdf-line-${page}-1`,
        division: '03',
        description: `Concrete work - Page ${page}`,
        cost: Math.random() * 100000,
        pageRef: page,
        confidence: 0.8 + Math.random() * 0.2,
        subcontractor: page % 2 === 0 ? 'ABC Concrete' : undefined
      });

      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.postProgress('normalizing', 0.9, 'Normalizing extracted data...');
    return this.normalizeLines(lines);
  }

  private async parseSpreadsheet(_file: File): Promise<CsiLine[]> {
    this.postProgress('parsing', 0.2, 'Loading spreadsheet...');

    // Note: In a real implementation, you'd use SheetJS (xlsx library) here
    // For now, we'll simulate spreadsheet parsing
    const lines: CsiLine[] = [];

    this.postProgress('extracting', 0.5, 'Reading spreadsheet rows...');

    // Mock spreadsheet parsing - replace with actual xlsx implementation
    for (let row = 1; row <= 20; row++) {
      // Simulate chunk processing
      if (row % 5 === 0) {
        this.postMessage({
          type: 'chunk',
          lines: lines.slice(-5),
          runId: this.runId
        });
      }

      lines.push({
        id: `xlsx-line-${row}`,
        division: String(Math.floor(Math.random() * 20) + 1).padStart(2, '0'),
        description: `Spreadsheet item ${row}`,
        cost: Math.random() * 50000,
        unit: ['SF', 'LF', 'EA', 'LS'][Math.floor(Math.random() * 4)],
        quantity: Math.floor(Math.random() * 1000),
        confidence: 0.9,
        pageRef: 1
      });

      // Yield control
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    this.postProgress('normalizing', 0.9, 'Normalizing spreadsheet data...');
    return this.normalizeLines(lines);
  }

  private normalizeLines(lines: CsiLine[]): CsiLine[] {
    return lines.map(line => ({
      ...line,
      // Normalize division numbers
      division: line.division.padStart(2, '0'),
      // Calculate unit cost if missing
      unitCost: line.unitCost || (line.quantity ? line.cost / line.quantity : undefined),
      // Clean description
      description: line.description.trim(),
      // Ensure confidence is bounded
      confidence: Math.max(0, Math.min(1, line.confidence))
    }));
  }
}

// Worker message handler
const parser = new DocumentParser();

self.onmessage = async (event: MessageEvent<ParseMessage>) => {
  const { type, file, runId } = event.data;

  if (type === 'parse') {
    await parser.parseFile(file, runId);
  }
};

// Export for TypeScript
export {};