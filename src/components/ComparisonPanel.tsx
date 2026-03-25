import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePathmindStore } from '../store/usePathmindStore';

export function ComparisonPanel() {
  const { results } = usePathmindStore();
  const best = [...results].sort((a, b) => b.efficiencyScore - a.efficiencyScore)[0];

  return (
    <div className="glass p-4 space-y-4">
      <h2 className="text-lg font-semibold">Algorithm Comparison</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-500/30">
              <th>Algorithm</th><th>Path Cost</th><th>Nodes</th><th>Time (ms)</th><th>Memory (bytes)</th><th>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.algorithm} className={best?.algorithm === r.algorithm ? 'text-emerald-400 font-semibold' : ''}>
                <td>{r.algorithm}</td><td>{r.pathCost.toFixed(2)}</td><td>{r.nodesExplored}</td><td>{r.timeMs.toFixed(2)}</td><td>{r.memoryBytes}</td><td>{r.efficiencyScore.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={results}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="algorithm" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="nodesExplored" fill="#a855f7" />
            <Bar dataKey="timeMs" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
