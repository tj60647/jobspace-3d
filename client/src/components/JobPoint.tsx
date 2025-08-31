import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { JobPosition } from '../types/api';
import * as THREE from 'three';

interface JobPointProps {
  position: JobPosition;
  isHighlighted?: boolean;
  onClick?: (position: JobPosition) => void;
}

export function JobPoint({ position, isHighlighted = false, onClick }: JobPointProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && isHighlighted) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  const handleClick = () => {
    if (onClick) {
      onClick(position);
    }
  };

  // Color based on source
  const getColor = (source: string) => {
    const colors: Record<string, string> = {
      greenhouse: '#00ff00',
      lever: '#ff6b00',
      ashby: '#6b73ff',
      recruitee: '#ff006b',
      smartrecruiters: '#ffff00'
    };
    return colors[source] || '#ffffff';
  };

  return (
    <mesh
      ref={meshRef}
      position={position.position}
      onClick={handleClick}
      scale={isHighlighted ? 1.5 : 1}
    >
      <sphereGeometry args={[0.01, 8, 8]} />
      <meshStandardMaterial
        color={getColor(position.source)}
        emissive={isHighlighted ? getColor(position.source) : '#000000'}
        emissiveIntensity={isHighlighted ? 0.3 : 0}
      />
    </mesh>
  );
}