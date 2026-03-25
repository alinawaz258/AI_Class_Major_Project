import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePathmindStore } from '../store/usePathmindStore';

const pseudo: Record<string, string[]> = {
  bfs: ['queue <- [start]', 'pop current', 'push unvisited neighbors', 'stop when goal is found'],
  dijkstra: ['dist[start]=0', 'pick min-dist unvisited', 'relax edges', 'repeat until goal'],
  astar: ['open <- start', 'select node with min f(n)', 'update g,h,f for neighbors', 'stop at goal'],
  qlearning: ['initialize Q table', 'choose action (epsilon-greedy)', 'update Q(s,a)', 'derive policy path'],
};

export function TrainingPanel() {
  const { results, activeStep, setStep, speedMs, playing, setPlaying } = usePathmindStore();
  const primary = results[0];
  const steps = primary?.steps ?? [];

  useEffect(() => {
    if (!playing || !steps.length) return;
    const timer = setInterval(() => {
      setStep((activeStep + 1) % steps.length);
    }, speedMs);
    return () => clearInterval(timer);
  }, [playing, activeStep, speedMs, setStep, steps.length]);

  const current = steps[Math.min(activeStep, Math.max(0, steps.length - 1))];
  const lines = useMemo(() => (primary ? pseudo[primary.algorithm] : []), [primary]);

  return (
    <div className="glass p-4 space-y-3">
      <h2 className="text-lg font-semibold">Training / Execution Panel</h2>
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded bg-indigo-500 text-white" onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Resume'}</button>
        <button className="px-3 py-1 rounded bg-slate-600 text-white" onClick={() => setStep(Math.max(0, activeStep - 1))}>Step -</button>
        <button className="px-3 py-1 rounded bg-slate-600 text-white" onClick={() => setStep(activeStep + 1)}>Step +</button>
      </div>
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="font-medium mb-1">Pseudocode</p>
          <ol className="list-decimal ml-5 space-y-1">
            {lines.map((line, idx) => (
              <li key={line} className={idx === activeStep % Math.max(1, lines.length) ? 'text-cyan-400' : ''}>{line}</li>
            ))}
          </ol>
        </div>
        <motion.div key={activeStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-medium">Live Explanation</p>
          <p>{current?.explanation ?? 'Run an algorithm to start guided educational mode.'}</p>
          {current?.scoreBreakdown && (
            <p className="mt-2 text-xs">g(n): {current.scoreBreakdown.g?.toFixed(2)} | h(n): {current.scoreBreakdown.h?.toFixed(2)} | f(n): {current.scoreBreakdown.f?.toFixed(2)}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
