import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { JobPoint } from '../types';

interface SceneProps {
  jobs: JobPoint[];
  highlightedJobs: Set<string>;
  onJobClick: (job: JobPoint) => void;
}

function JobPoints({ jobs, highlightedJobs, onJobClick }: SceneProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera, raycaster, pointer } = useThree();

  // Create positions array for all jobs
  const positions = useMemo(() => {
    const positions = new Float32Array(jobs.length * 3);
    jobs.forEach((job, i) => {
      positions[i * 3] = job.x;
      positions[i * 3 + 1] = job.y;
      positions[i * 3 + 2] = job.z;
    });
    return positions;
  }, [jobs]);

  // Create colors array (highlighted jobs are red, others are blue)
  const colors = useMemo(() => {
    const colors = new Float32Array(jobs.length * 3);
    jobs.forEach((job, i) => {
      const isHighlighted = highlightedJobs.has(job.id);
      colors[i * 3] = isHighlighted ? 1 : 0.3;     // R
      colors[i * 3 + 1] = isHighlighted ? 0.3 : 0.7; // G
      colors[i * 3 + 2] = isHighlighted ? 0.3 : 1;   // B
    });
    return colors;
  }, [jobs, highlightedJobs]);

  // Handle click events
  const handleClick = (event: any) => {
    event.stopPropagation();
    
    raycaster.setFromCamera(pointer, camera);
    
    if (pointsRef.current) {
      const intersects = raycaster.intersectObject(pointsRef.current);
      
      if (intersects.length > 0) {
        const index = intersects[0].index;
        if (index !== undefined && jobs[index]) {
          onJobClick(jobs[index]);
        }
      }
    }
  };

  return (
    <Points
      ref={pointsRef}
      positions={positions}
      colors={colors}
      onClick={handleClick}
    >
      <PointMaterial
        size={8}
        vertexColors
        transparent
        alphaTest={0.5}
        sizeAttenuation={false}
      />
    </Points>
  );
}

function AnimatedCameraControls() {
  const controlsRef = useRef<any>();
  
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      autoRotate={false}
      autoRotateSpeed={0.5}
    />
  );
}

export function Scene({ jobs, highlightedJobs, onJobClick }: SceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 2], fov: 75 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <JobPoints 
          jobs={jobs} 
          highlightedJobs={highlightedJobs} 
          onJobClick={onJobClick} 
        />
        
        <AnimatedCameraControls />
        
        {/* Add a grid for reference */}
        <gridHelper args={[2, 10, 0x444444, 0x444444]} />
      </Canvas>
    </div>
  );
}