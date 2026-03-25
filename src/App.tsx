import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ComparisonPanel } from './components/ComparisonPanel';
import { ControlPanel } from './components/ControlPanel';
import { MapPanel } from './components/MapPanel';
import { TrainingPanel } from './components/TrainingPanel';
import { usePathmindStore } from './store/usePathmindStore';

export default function App() {
  const { darkMode } = usePathmindStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <motion.h1 className="text-3xl font-bold mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        PathMind AI Visualization Platform
      </motion.h1>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-4"><ControlPanel /><TrainingPanel /></div>
        <div className="lg:col-span-2 space-y-4"><MapPanel /><ComparisonPanel /></div>
      </div>
    </div>
  );
}
