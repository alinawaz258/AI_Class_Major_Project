import { AlgorithmResult, GraphData, SearchStep } from '../types/graph';
import { buildAdjacency, estimateMemory, reconstructPath } from '../utils/graph';

export function runBfs(graph: GraphData, start: string, goal: string): AlgorithmResult {
  const t0 = performance.now();
  const adjacency = buildAdjacency(graph);
  const queue = [start];
  const visited = new Set([start]);
  const cameFrom = new Map<string, string | null>([[start, null]]);
  const steps: SearchStep[] = [];
  let frontierPeak = 1;

  while (queue.length) {
    frontierPeak = Math.max(frontierPeak, queue.length);
    const current = queue.shift()!;
    steps.push({
      current,
      frontier: [...queue],
      visited: [...visited],
      explanation: 'BFS explores all nodes level-by-level with uniform expansion.',
    });

    if (current === goal) break;

    for (const next of adjacency.get(current) ?? []) {
      if (visited.has(next.to)) continue;
      visited.add(next.to);
      cameFrom.set(next.to, current);
      queue.push(next.to);
    }
  }

  const path = reconstructPath(cameFrom, goal);
  const timeMs = performance.now() - t0;
  return {
    algorithm: 'bfs',
    path,
    pathCost: Math.max(0, path.length - 1),
    nodesExplored: visited.size,
    timeMs,
    memoryBytes: estimateMemory(steps.length, frontierPeak),
    efficiencyScore: Number((10000 / (1 + timeMs + visited.size)).toFixed(2)),
    steps,
  };
}
