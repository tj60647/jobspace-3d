import { useState } from 'react';
import { Scene } from './components/Scene';
import { ResumeDropZone } from './components/ResumeDropZone';

function App() {
  const [highlightedJobs, setHighlightedJobs] = useState<Set<string>>(new Set());

  const handleResumeProcessed = (jobIds: string[]) => {
    setHighlightedJobs(new Set(jobIds));
  };

  const clearHighlights = () => {
    setHighlightedJobs(new Set());
  };

  return (
    <div className="relative w-full h-full">
      <Scene highlightedJobs={highlightedJobs} />
      <ResumeDropZone onResumeProcessed={handleResumeProcessed} />
      
      {highlightedJobs.size > 0 && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={clearHighlights}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Clear Highlights
          </button>
        </div>
      )}

      {/* Source Legend */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded">
        <h4 className="font-semibold mb-2">Job Sources</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Greenhouse</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Lever</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Ashby</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span>Recruitee</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>SmartRecruiters</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;