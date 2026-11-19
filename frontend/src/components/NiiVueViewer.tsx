import React, { useEffect, useRef, useState } from 'react';
import { Niivue, SLICE_TYPE } from '@niivue/niivue';
import {
  Layers,
  Eye,
  RefreshCw,
  ZoomIn,
  Sliders,
  Box,
  RotateCw,
  Compass,
  Move,
} from 'lucide-react';

interface NiiVueViewerProps {
  mriUrl: string;
  maskUrl?: string;
  onVoxelClick?: (coords: { mni: [number, number, number]; value: number }) => void;
  maskOpacity?: number;
}

export const NiiVueViewer: React.FC<NiiVueViewerProps> = ({
  mriUrl,
  maskUrl,
  onVoxelClick,
  maskOpacity = 0.65,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nvRef = useRef<Niivue | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sliceType, setSliceType] = useState<number>(SLICE_TYPE.MULTIPLANAR);
  const [currentOpacity, setCurrentOpacity] = useState<number>(maskOpacity);
  const [crosshairPos, setCrosshairPos] = useState<string>('--, --, --');
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const rotationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let isSubscribed = true;
    setLoading(true);
    setLoadError(null);

    const nv = new Niivue({
      show3Dcrosshair: true,
      backColor: [0.06, 0.09, 0.16, 1], // Slate-950
      crosshairColor: [0.14, 0.65, 0.95, 0.8], // Sky-500
      loadingText: 'Rendering Volumetric MRI...',
      dragAndDropEnabled: false,
    });

    nvRef.current = nv;
    nv.attachToCanvas(canvasRef.current);
    nv.setSliceType(sliceType);

    // Initial 3D camera angle
    nv.setRenderAzimuthElevation(120, 20);

    // Listen to voxel selection/clicks
    nv.onLocationChange = (data: unknown) => {
      const loc = data as { mm?: [number, number, number]; values?: Array<{ value: number }> } | undefined;
      if (loc && loc.mm) {
        const [x, y, z] = loc.mm.map((v) => Math.round(v));
        setCrosshairPos(`${x}, ${y}, ${z}`);
        if (onVoxelClick) {
          const val = loc.values && loc.values.length > 1 ? loc.values[1].value : 0;
          onVoxelClick({
            mni: [x, y, z],
            value: val,
          });
        }
      }
    };

    const volumeList = [
      {
        url: mriUrl,
        name: 'mri.nii.gz',
        colormap: 'gray',
        opacity: 1.0,
      },
    ];

    if (maskUrl) {
      volumeList.push({
        url: maskUrl,
        name: 'mask.nii.gz',
        colormap: 'red',
        opacity: currentOpacity,
      });
    }

    nv.loadVolumes(volumeList)
      .then(() => {
        if (!isSubscribed) return;
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isSubscribed) return;
        setLoading(false);
        const msg = err instanceof Error ? err.message : 'Failed to load volumetric NIfTI data';
        setLoadError(msg);
      });

    return () => {
      isSubscribed = false;
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
      try {
        nv.cleanup();
      } catch {
        // Ignore cleanup errors on unmount
      }
    };
  }, [mriUrl, maskUrl]);

  // Handle slice type change
  const handleSliceTypeChange = (type: number) => {
    setSliceType(type);
    if (nvRef.current) {
      nvRef.current.setSliceType(type);
    }
  };

  // Handle overlay mask opacity change
  const handleOpacityChange = (newVal: number) => {
    setCurrentOpacity(newVal);
    if (nvRef.current && nvRef.current.volumes.length > 1) {
      nvRef.current.setOpacity(1, newVal);
      nvRef.current.updateGLVolume();
    }
  };

  // Manual rotation step
  const handleRotateStep = (deltaAzimuth: number, deltaElevation: number = 0) => {
    if (nvRef.current) {
      const currentAz = nvRef.current.scene.renderAzimuth;
      const currentEl = nvRef.current.scene.renderElevation;
      nvRef.current.setRenderAzimuthElevation(
        (currentAz + deltaAzimuth) % 360,
        Math.max(-85, Math.min(85, currentEl + deltaElevation))
      );
    }
  };

  // Quick preset angle view
  const handlePresetView = (azimuth: number, elevation: number) => {
    if (nvRef.current) {
      nvRef.current.setRenderAzimuthElevation(azimuth, elevation);
    }
  };

  // Toggle Continuous Auto-Rotation
  const toggleAutoRotate = () => {
    if (isRotating) {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
      setIsRotating(false);
    } else {
      setIsRotating(true);
      rotationTimerRef.current = setInterval(() => {
        if (nvRef.current) {
          const currentAz = nvRef.current.scene.renderAzimuth;
          const currentEl = nvRef.current.scene.renderElevation;
          nvRef.current.setRenderAzimuthElevation((currentAz + 1.5) % 360, currentEl);
        }
      }, 30);
    }
  };

  // Reset orientation
  const handleReset = () => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = null;
      setIsRotating(false);
    }
    if (nvRef.current) {
      nvRef.current.resetBriCon();
      nvRef.current.setRenderAzimuthElevation(120, 20);
      nvRef.current.setSliceType(SLICE_TYPE.MULTIPLANAR);
      setSliceType(SLICE_TYPE.MULTIPLANAR);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Top Controls Bar */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        {/* Slice View Layout Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleSliceTypeChange(SLICE_TYPE.MULTIPLANAR)}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              sliceType === SLICE_TYPE.MULTIPLANAR
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MPR Quad</span>
          </button>
          <button
            onClick={() => handleSliceTypeChange(SLICE_TYPE.AXIAL)}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
              sliceType === SLICE_TYPE.AXIAL
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Axial
          </button>
          <button
            onClick={() => handleSliceTypeChange(SLICE_TYPE.CORONAL)}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
              sliceType === SLICE_TYPE.CORONAL
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Coronal
          </button>
          <button
            onClick={() => handleSliceTypeChange(SLICE_TYPE.SAGITTAL)}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
              sliceType === SLICE_TYPE.SAGITTAL
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Sagittal
          </button>
          <button
            onClick={() => handleSliceTypeChange(SLICE_TYPE.RENDER)}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              sliceType === SLICE_TYPE.RENDER
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Full View</span>
          </button>
        </div>

        {/* 3D Rotation Toolbar */}
        <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 px-1 font-medium flex items-center gap-1">
            <Compass className="w-3 h-3 text-purple-400" />
            3D View:
          </span>

          <button
            onClick={() => handleRotateStep(-30, 0)}
            title="Rotate Left 30°"
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md text-[11px] font-mono border border-slate-800"
          >
            ↺ Left
          </button>
          <button
            onClick={() => handleRotateStep(30, 0)}
            title="Rotate Right 30°"
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md text-[11px] font-mono border border-slate-800"
          >
            ↻ Right
          </button>
          <button
            onClick={() => handleRotateStep(0, 20)}
            title="Tilt Up"
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md text-[11px] font-mono border border-slate-800"
          >
            ↑ Top
          </button>
          <button
            onClick={() => handleRotateStep(0, -20)}
            title="Tilt Down"
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md text-[11px] font-mono border border-slate-800"
          >
            ↓ Base
          </button>

          {/* Quick anatomical perspectives */}
          <button
            onClick={() => handlePresetView(0, 0)}
            title="Anterior Perspective"
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-purple-300 rounded-md text-[11px] font-medium border border-slate-800"
          >
            Ant
          </button>
          <button
            onClick={() => handlePresetView(180, 0)}
            title="Posterior Perspective"
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-purple-300 rounded-md text-[11px] font-medium border border-slate-800"
          >
            Post
          </button>
          <button
            onClick={() => handlePresetView(90, 0)}
            title="Lateral Perspective"
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-purple-300 rounded-md text-[11px] font-medium border border-slate-800"
          >
            Lat
          </button>

          {/* Continuous Auto-Rotate Toggle */}
          <button
            onClick={toggleAutoRotate}
            title={isRotating ? 'Stop 360° Rotation' : 'Start 360° Continuous Rotation'}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 ${
              isRotating
                ? 'bg-purple-600 text-white animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
            <span>{isRotating ? 'Rotating' : '360° Spin'}</span>
          </button>
        </div>

        {/* Mask Opacity Slider */}
        {maskUrl && (
          <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Sliders className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400 text-[11px]">Tumor Opacity:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={currentOpacity}
              onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
              className="w-16 accent-red-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-slate-300 font-mono text-[11px] w-7">
              {Math.round(currentOpacity * 100)}%
            </span>
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={handleReset}
          title="Reset View and Orientation"
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700/80"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* WebGL Canvas Container */}
      <div className="relative flex-1 w-full min-h-[540px] bg-slate-950">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing focus:outline-none"
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-20">
            <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-slate-300">
              Loading High-Resolution Medical Volume...
            </span>
            <span className="text-xs text-slate-500">Initializing WebGL Multiplanar Quad Layout</span>
          </div>
        )}

        {/* Error Overlay */}
        {loadError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <Eye className="w-6 h-6" />
            </div>
            <span className="text-base font-semibold text-slate-200">Visualization Failed</span>
            <p className="text-xs text-red-400 max-w-md leading-relaxed">{loadError}</p>
          </div>
        )}
      </div>

      {/* Bottom Interactive Instruction Bar */}
      <div className="bg-slate-900/60 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Move className="w-3.5 h-3.5 text-purple-400" />
            <span><strong>Rotate 3D Brain:</strong> Click and drag inside the 3D quadrant or switch to <strong>3D Full View</strong></span>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-400">
            <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
            <span>Scroll wheel zooms / steps through slices</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
          <span>Coords: [{crosshairPos}]</span>
        </div>
      </div>
    </div>
  );
};
