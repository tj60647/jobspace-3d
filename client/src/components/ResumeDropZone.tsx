import React, { useState, useCallback } from 'react';
import { extractTextFromFile } from '../utils/pdf';
import { apiClient } from '../services/api';

interface ResumeDropZoneProps {
  onResumeProcessed?: (highlightedJobIds: string[]) => void;
}

export function ResumeDropZone({ onResumeProcessed }: ResumeDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;
    
    await processFile(file);
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await processFile(files[0]);
  }, []);

  const processFile = async (file: File) => {
    if (!file.type.includes('pdf') && !file.type.includes('text')) {
      setStatus('Please upload a PDF or text file');
      return;
    }

    setIsProcessing(true);
    setStatus('Processing resume...');

    try {
      // Extract text from file
      const text = await extractTextFromFile(file);
      
      if (text.length < 50) {
        setStatus('Resume text seems too short. Please check the file.');
        return;
      }

      setStatus('Generating embedding...');

      // Generate embedding for resume
      await apiClient.generateEmbedding(text);

      setStatus('Finding similar jobs...');

      // For now, highlight a heuristic subset of jobs
      // In the future, this would use a proper similarity matching endpoint
      const highlightedJobs = generatePlaceholderHighlights();

      if (onResumeProcessed) {
        onResumeProcessed(highlightedJobs);
      }

      setStatus(`Found ${highlightedJobs.length} matching jobs!`);

      // Clear status after a few seconds
      setTimeout(() => setStatus(null), 3000);

    } catch (error) {
      console.error('Error processing resume:', error);
      setStatus('Error processing resume. Please try again.');
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Placeholder logic for highlighting jobs
  // In the future, this would be replaced with real similarity scoring
  const generatePlaceholderHighlights = (): string[] => {
    // Return a random subset of job IDs
    // This is just a placeholder until the /api/match endpoint is implemented
    const sampleJobIds = Array.from({ length: 15 }, (_, i) => `job_${i}`);
    return sampleJobIds;
  };

  return (
    <div className="absolute top-4 right-4 w-80">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-white bg-opacity-90'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-gray-600">
            <svg
              className="mx-auto h-12 w-12"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">Drop your resume here</p>
            <p className="text-sm text-gray-500">PDF or text files only</p>
          </div>

          <div className="text-center">
            <label
              htmlFor="resume-upload"
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-block"
            >
              Choose File
            </label>
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {(isProcessing || status) && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              {isProcessing && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">{status}</span>
                </div>
              )}
              {!isProcessing && status && (
                <p className="text-sm text-gray-700">{status}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}