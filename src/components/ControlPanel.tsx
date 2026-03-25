import { motion } from 'framer-motion';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner';
import { usePathmindStore } from '../store/usePathmindStore';
import { AlgorithmKey } from '../types/graph';

const algorithms: AlgorithmKey[] = ['bfs', 'dijkstra', 'astar', 'qlearning'];

export function ControlPanel() {
  const runAll = useAlgorithmRunner();
  const { selected, toggleAlgorithm, graphDensity, setDensity, speedMs, setSpeed, darkMode, setDarkMode } = usePathmindStore();

  return (
    <motion.div layout className="glass p-4 space-y-4">
      <h2 className="text-lg font-semibold">Control Panel</h2>
      <div className="flex flex-wrap gap-2">
        {algorithms.map((a) => (
          <button
            key={a}
            onClick={() => toggleAlgorithm(a)}
            className={`px-3 py-1 rounded-xl border ${selected.includes(a) ? 'bg-indigo-500 text-white' : 'bg-transparent'}`}
          >
            {a.toUpperCase()}
          </button>
        ))}
      </div>
      <label className="block text-sm">Graph Density: {graphDensity}</label>
      <input type="range" min={8} max={40} value={graphDensity} onChange={(e) => setDensity(Number(e.target.value))} className="w-full" />
      <label className="block text-sm">Step Speed: {speedMs}ms</label>
      <input type="range" min={100} max={1200} step={50} value={speedMs} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full" />
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-xl bg-emerald-500 text-white" onClick={() => void runAll()}>
          Run Comparison
        </button>
        <button className="px-4 py-2 rounded-xl bg-slate-700 text-white" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </motion.div>
  );
}
