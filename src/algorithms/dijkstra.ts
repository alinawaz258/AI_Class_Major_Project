import { AlgorithmResult, GraphData, SearchStep } from '../types/graph';
import { buildAdjacency, estimateMemory, reconstructPath } from '../utils/graph';

export function runDijkstra(graph: GraphData, start: string, goal: string): AlgorithmResult {
  const t0 = performance.now();
  const adjacency = buildAdjacency(graph);
  const dist = new Map<string, number>(graph.nodes.map((n) => [n.id, Number.POSITIVE_INFINITY]));
  const cameFrom = new Map<string, string | null>([[start, null]]);
  const visited = new Set<string>();
  const steps: SearchStep[] = [];
  dist.set(start, 0);
  let frontierPeak = 1;

  while (visited.size < graph.nodes.length) {
    const current = [...dist.entries()]
      .filter(([id]) => !visited.has(id))
      .sort((a, b) => a[1] - b[1])[0]?.[0];

    if (!current) break;
    frontierPeak = Math.max(frontierPeak, graph.nodes.length - visited.size);
    visited.add(current);

    steps.push({
      current,
      frontier: [...dist.entries()].filter(([id]) => !visited.has(id)).map(([id]) => id),
      visited: [...visited],
      explanation: 'Dijkstra expands the lowest-cost known node and guarantees optimal weighted paths.',
      scoreBreakdown: { g: dist.get(current), h: 0, f: dist.get(current) },
    });

    if (current === goal) break;

    for (const edge of adjacency.get(current) ?? []) {
      const alt = (dist.get(current) ?? 0) + edge.cost;
      if (alt < (dist.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        dist.set(edge.to, alt);
        cameFrom.set(edge.to, current);
      }
    }
  }

  const path = reconstructPath(cameFrom, goal);
  const timeMs = performance.now() - t0;

  return {
    algorithm: 'dijkstra',
    path,
    pathCost: dist.get(goal) ?? Number.POSITIVE_INFINITY,
    nodesExplored: visited.size,
    timeMs,
    memoryBytes: estimateMemory(steps.length, frontierPeak),
    efficiencyScore: Number((12000 / (1 + timeMs + visited.size)).toFixed(2)),
    steps,
  };
}
