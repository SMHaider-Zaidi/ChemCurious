'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileUp, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuestionMutations } from '@/lib/admin/hooks';
import type { BulkImportRow, Difficulty, OptionKey } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export interface BulkImportDialogProps {
  chapterId: number;
  chapterTitle: string;
}

interface ParsedRowResult {
  row: BulkImportRow;
  rowNumber: number;
  errors: string[];
  isValid: boolean;
}

export function BulkImportDialog({ chapterId, chapterTitle }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const { bulkImport } = useQuestionMutations();

  const handleFileUpload = async (file?: File) => {
    setFileError(null);
    setParsedRows([]);
    if (!file) return;

    setFileName(file.name);
    const content = await file.text();

    try {
      let rawData: Record<string, unknown>[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) throw new Error('JSON file must contain an array of question objects.');
        rawData = parsed;
      } else {
        const res = Papa.parse<Record<string, unknown>>(content, {
          header: true,
          skipEmptyLines: true,
        });
        if (res.errors.length > 0) {
          throw new Error(res.errors[0]?.message || 'CSV format error');
        }
        rawData = res.data;
      }

      if (rawData.length === 0) {
        throw new Error('The selected file contains no data rows.');
      }
      if (rawData.length > 500) {
        throw new Error('Maximum batch size is 500 questions.');
      }

      const results: ParsedRowResult[] = rawData.map((row, idx) => {
        const rowNum = idx + 1;
        const errors: string[] = [];

        const text = String(row['text'] ?? row['question'] ?? '').trim();
        const optA = String(row['optionA'] ?? row['A'] ?? '').trim();
        const optB = String(row['optionB'] ?? row['B'] ?? '').trim();
        const optC = String(row['optionC'] ?? row['C'] ?? '').trim();
        const optD = String(row['optionD'] ?? row['D'] ?? '').trim();
        const rawCorrect = String(row['correct'] ?? row['answer'] ?? '').trim().toUpperCase();
        const rawDiff = String(row['difficulty'] ?? 'easy').trim().toLowerCase();
        const explanation = String(row['explanation'] ?? '').trim();
        const topic = String(row['topic'] ?? '').trim();
        const marks = Number(row['marks'] ?? 1);

        if (text.length < 3) errors.push('Question text too short');
        if (!optA) errors.push('Option A missing');
        if (!optB) errors.push('Option B missing');
        if (!optC) errors.push('Option C missing');
        if (!optD) errors.push('Option D missing');
        if (!['A', 'B', 'C', 'D'].includes(rawCorrect)) errors.push('Correct answer must be A, B, C, or D');
        if (!['easy', 'medium', 'hard'].includes(rawDiff)) errors.push('Difficulty must be easy, medium, or hard');
        if (isNaN(marks) || marks < 1) errors.push('Marks must be at least 1');

        return {
          rowNumber: rowNum,
          errors,
          isValid: errors.length === 0,
          row: {
            text,
            options: { A: optA, B: optB, C: optC, D: optD },
            correct: (['A', 'B', 'C', 'D'].includes(rawCorrect) ? rawCorrect : 'A') as OptionKey,
            explanation,
            difficulty: (['easy', 'medium', 'hard'].includes(rawDiff) ? rawDiff : 'easy') as Difficulty,
            topic,
            marks: isNaN(marks) || marks < 1 ? 1 : marks,
          },
        };
      });

      setParsedRows(results);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Could not process the uploaded file.');
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const errorCount = parsedRows.filter((r) => !r.isValid).length;

  const handleConfirmImport = async () => {
    if (errorCount > 0 || validCount === 0) return;

    await bulkImport.mutateAsync({
      req: {
        chapterId,
        rows: parsedRows.map((r) => r.row),
      },
      dryRun: false,
    });

    setOpen(false);
    setParsedRows([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" /> Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Bulk Import Questions</DialogTitle>
          <DialogDescription>
            Import questions directly into chapter{' '}
            <strong className="text-foreground">"{chapterTitle}"</strong> using a CSV or JSON file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto py-2">
          {/* File input drag/drop box */}
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center hover:bg-muted/30 transition-colors">
            <FileUp className="h-10 w-10 text-muted-foreground/70 mb-2" />
            <p className="text-sm font-medium text-foreground">
              {fileName ? fileName : 'Select a CSV or JSON file'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              CSV required columns:{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                text, optionA, optionB, optionC, optionD, correct, explanation, difficulty, topic, marks
              </code>
            </p>
            <label className="mt-4">
              <Button variant="secondary" size="sm" asChild className="cursor-pointer">
                <span>Browse File</span>
              </Button>
              <input
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
            </label>
          </div>

          {fileError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Validation Summary & Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                    <CheckCircle className="h-3 w-3" /> {validCount} Valid
                  </Badge>
                  {errorCount > 0 && (
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1">
                      <AlertTriangle className="h-3 w-3" /> {errorCount} Invalid
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground">Total: {parsedRows.length} questions parsed</span>
              </div>

              {/* Parsed Rows Table */}
              <div className="rounded-lg border border-border overflow-hidden max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-12 text-xs">#</TableHead>
                      <TableHead className="text-xs">Question Text</TableHead>
                      <TableHead className="w-20 text-xs">Ans</TableHead>
                      <TableHead className="w-24 text-xs">Diff</TableHead>
                      <TableHead className="w-48 text-xs">Validation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((item) => (
                      <TableRow
                        key={item.rowNumber}
                        className={cn(!item.isValid && 'bg-rose-500/5')}
                      >
                        <TableCell className="font-mono text-xs">{item.rowNumber}</TableCell>
                        <TableCell className="text-xs truncate max-w-xs">
                          {item.row.text}
                        </TableCell>
                        <TableCell className="text-xs font-bold">{item.row.correct}</TableCell>
                        <TableCell className="text-xs capitalize">{item.row.difficulty}</TableCell>
                        <TableCell className="text-xs">
                          {item.isValid ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> OK
                            </span>
                          ) : (
                            <span className="text-destructive font-medium">
                              {item.errors.join('; ')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={
              validCount === 0 ||
              errorCount > 0 ||
              bulkImport.isPending
            }
            onClick={handleConfirmImport}
          >
            {bulkImport.isPending
              ? 'Importing...'
              : `Import ${validCount} Questions as Drafts`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
