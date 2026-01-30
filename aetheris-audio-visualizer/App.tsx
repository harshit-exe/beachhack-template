
import React, { useState, useCallback, useRef } from 'react';
import VisualizerScene from './components/VisualizerScene';
import Overlay from './components/Overlay';

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    const analyserNode = audioContextRef.current.createAnalyser();
    analyserNode.fftSize = 256;
    return { context: audioContextRef.current, analyser: analyserNode };
  };

  const startMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio input.");
      return;
    }

    try {
      const { context, analyser: analyserNode } = initAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = context.createMediaStreamSource(stream);
      source.connect(analyserNode);
      
      setAnalyser(analyserNode);
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      alert(`Error accessing microphone: ${err.message}`);
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (audioRef.current) {
        const { context, analyser: analyserNode } = initAudio();
        
        audioRef.current.src = url;
        audioRef.current.crossOrigin = "anonymous";
        
        // Connect the element to the analyser
        const source = context.createMediaElementSource(audioRef.current);
        source.connect(analyserNode);
        analyserNode.connect(context.destination);
        
        audioRef.current.play();
        setAnalyser(analyserNode);
        setIsPlaying(true);
      }
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-[#f8fafc] overflow-hidden font-sans">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <VisualizerScene analyser={analyser} isPlaying={isPlaying} />
      </div>

      {/* Hidden Audio Element for local files */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      {/* UI Overlay */}
      <Overlay 
        isPlaying={isPlaying} 
        onMicStart={startMicrophone} 
        onFileUpload={handleFileUpload} 
      />

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-400 text-[10px] tracking-[0.3em] font-light pointer-events-none uppercase text-center w-full px-4">
        Aetheris Neural Engine // Protocol Synchronized
      </div>
    </div>
  );
};

export default App;