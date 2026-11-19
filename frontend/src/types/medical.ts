// Shared TypeScript types for BrainTumor 3D

export interface CaseSummary {
  caseId: string;
  mriShape: [number, number, number];
  spacing: [number, number, number];
  maskLabels: number[];
  volumeCm3: number;
  centroidMm?: [number, number, number];
}

export interface DemoPresetInfo {
  demoId: string;
  title: string;
  description: string;
}

export interface ReconstructResponse {
  brainVertices: number[][];
  brainFaces: number[][];
  tumorVertices: number[][];
  tumorFaces: number[][];
  centroidMm: [number, number, number];
}

export interface TumorLocation {
  regionName: string;
  regionProbability: number;
  hemisphere: 'Left' | 'Right' | 'Midline';
  primaryPlane: 'Axial' | 'Coronal' | 'Sagittal';
  mniCoords: [number, number, number];
  volumeCm3: number;
  nearbyStructures: string[];
}

export interface Question {
  id: number;
  category: 'lobe' | 'hemisphere' | 'plane' | 'meaning' | 'volume';
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface HealthStatus {
  status: string;
  atlasLoaded: boolean;
}
