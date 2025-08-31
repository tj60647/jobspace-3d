import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { JobPoint } from './JobPoint';
import { JobPosition } from '../types/api';
import { apiClient } from '../services/api';

interface SceneProps {
  highlightedJobs?: Set<string>;
}

export function Scene({ highlightedJobs = new Set() }: SceneProps) {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPositions();
      setPositions(response.positions);
      setError(null);
    } catch (err) {
      console.error('Error loading positions:', err);
      setError('Failed to load job positions');
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (position: JobPosition) => {
    setSelectedJob(position);
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p>Loading job positions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadPositions}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Canvas
        camera={{ position: [1, 1, 1], fov: 75 }}
        style={{ background: '#0a0a0a' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />

          {positions.map((position) => (
            <JobPoint
              key={position.id}
              position={position}
              isHighlighted={highlightedJobs.has(position.id)}
              onClick={handleJobClick}
            />
          ))}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={0.5}
            maxDistance={10}
          />
        </Suspense>
      </Canvas>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{selectedJob.title}</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              <p><strong>Company:</strong> {selectedJob.company}</p>
              <p><strong>Source:</strong> {selectedJob.source}</p>
              <p>
                <strong>Position:</strong> [{selectedJob.position.map(p => p.toFixed(3)).join(', ')}]
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded">
        <h3 className="font-semibold mb-2">Job Space 3D</h3>
        <p className="text-sm">Jobs: {positions.length}</p>
        {highlightedJobs.size > 0 && (
          <p className="text-sm">Highlighted: {highlightedJobs.size}</p>
        )}
      </div>
    </>
  );
}