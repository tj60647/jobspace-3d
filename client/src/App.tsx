import React, { useState, useEffect, useCallback } from 'react';
import { Scene } from './components/Scene';
import { fetchPositions, embedText } from './api';
import { extractTextFromPDF } from './pdf';
import { cosineSimilarity } from './cosine';
import type { JobPoint } from './types';

function App() {
  const [jobs, setJobs] = useState<JobPoint[]>([]);
  const [highlightedJobs, setHighlightedJobs] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<JobPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [userEmbedding, setUserEmbedding] = useState<number[] | null>(null);

  // Load jobs on component mount
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchPositions();
      setJobs(response.jobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = useCallback((job: JobPoint) => {
    setSelectedJob(job);
  }, []);

  const handleFileDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const files = Array.from(event.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (!pdfFile) {
      setError('Please drop a PDF file');
      return;
    }

    await processResumeFile(pdfFile);
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      await processResumeFile(file);
    } else {
      setError('Please select a PDF file');
    }
  }, []);

  const processResumeFile = async (file: File) => {
    try {
      setProcessing(true);
      setError(null);
      
      // Extract text from PDF
      console.log('Extracting text from PDF...');
      const resumeText = await extractTextFromPDF(file);
      
      if (!resumeText.trim()) {
        setError('No text found in PDF');
        return;
      }

      // Generate embedding for resume text
      console.log('Generating embedding...');
      const embedResponse = await embedText(resumeText);
      setUserEmbedding(embedResponse.embedding);

      // Find similar jobs using cosine similarity
      const similarities = jobs.map(job => {
        // For now, we'll use a placeholder similarity calculation
        // In a real implementation, we'd need the job embeddings from the server
        const similarity = Math.random(); // Placeholder
        return { job, similarity };
      });

      // Sort by similarity and highlight top matches
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topMatches = similarities.slice(0, 10); // Top 10 matches
      
      const highlighted = new Set(topMatches.map(match => match.job.id));
      setHighlightedJobs(highlighted);

      console.log(`Highlighted ${highlighted.size} similar jobs`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process resume');
    } finally {
      setProcessing(false);
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const clearHighlights = useCallback(() => {
    setHighlightedJobs(new Set());
    setUserEmbedding(null);
    setSelectedJob(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading 3D job visualization...</div>
      </div>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">
          <div className="text-lg font-semibold">Error</div>
          <div>{error}</div>
          <button 
            onClick={loadJobs}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* 3D Scene */}
      <Scene 
        jobs={jobs} 
        highlightedJobs={highlightedJobs}
        onJobClick={handleJobClick}
      />
      
      {/* Controls Panel */}
      <div className="controls-panel">
        <h3 className="text-lg font-semibold mb-3">3D Job Map</h3>
        
        <div className="mb-4">
          <div 
            className={`drop-zone mb-3 ${processing ? 'opacity-50' : ''}`}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
          >
            {processing ? (
              <div>Processing resume...</div>
            ) : (
              <div>
                <div className="text-sm font-medium mb-2">Drop your resume (PDF)</div>
                <div className="text-xs text-gray-600">or</div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="mt-2"
                  disabled={processing}
                />
              </div>
            )}
          </div>
          
          {highlightedJobs.size > 0 && (
            <button
              onClick={clearHighlights}
              className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear highlights ({highlightedJobs.size})
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <div>Total jobs: {jobs.length}</div>
          {highlightedJobs.size > 0 && (
            <div className="text-blue-600">
              Highlighted: {highlightedJobs.size} similar jobs
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Job Info Panel */}
      {selectedJob && (
        <div className="job-info-panel">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold">Job Details</h3>
            <button
              onClick={() => setSelectedJob(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="font-medium">{selectedJob.title}</div>
              <div className="text-gray-600">{selectedJob.company}</div>
            </div>
            
            <div className="text-sm text-gray-600">
              Posted: {new Date(selectedJob.postedAt).toLocaleDateString()}
            </div>
            
            <div className="text-xs text-gray-500">
              Position: ({selectedJob.x.toFixed(3)}, {selectedJob.y.toFixed(3)}, {selectedJob.z.toFixed(3)})
            </div>
            
            {selectedJob.applyUrl && (
              <a
                href={selectedJob.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Apply Now
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;