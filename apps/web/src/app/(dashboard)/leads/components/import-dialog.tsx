'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { CreateContactInput } from '@linkedin-crm/types';
import { X, Upload, FileText } from 'lucide-react';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const importMutation = useMutation({
    mutationFn: async (contacts: CreateContactInput[]) => {
      const { error } = await supabase.from('contacts').insert(contacts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      handleClose();
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const data = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(',');
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || '';
          });
          return row;
        });

      setPreview(data.slice(0, 5)); // Show first 5 rows
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const contacts: CreateContactInput[] = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(',');
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || '';
          });

          return {
            first_name: row.first_name || row.firstname || '',
            last_name: row.last_name || row.lastname || '',
            email: row.email || undefined,
            phone: row.phone || undefined,
            title: row.title || row.position || undefined,
            linkedin_url: row.linkedin_url || row.linkedin || undefined,
            location: row.location || undefined,
            source: 'csv_import',
          };
        })
        .filter((contact) => contact.first_name && contact.last_name);

      importMutation.mutate(contacts);
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Import Leads from CSV</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV file with headers</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* CSV Format Guide */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="text-sm font-medium text-blue-900">CSV Format</h3>
            <p className="mt-1 text-sm text-blue-700">
              Your CSV should include these columns: first_name, last_name, email, phone, title,
              linkedin_url, location
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Required: first_name, last_name. All other fields are optional.
            </p>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Preview (first 5 rows)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Title
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {preview.map((row, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {row.first_name || row.firstname} {row.last_name || row.lastname}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{row.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {row.title || row.position}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importMutation.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {importMutation.isPending ? 'Importing...' : 'Import Leads'}
          </button>
        </div>
      </div>
    </div>
  );
}
