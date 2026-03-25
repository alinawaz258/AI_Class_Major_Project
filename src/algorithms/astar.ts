import { AlgorithmResult, GraphData, SearchStep } from '../types/graph';
import { buildAdjacency, estimateMemory, haversineMeters, reconstructPath } from '../utils/graph';

export function runAStar(graph: GraphData, start: string, goal: string): AlgorithmResult {
  const t0 = performance.now();
  const adjacency = buildAdjacency(graph);
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));

  const g = new Map<string, number>(graph.nodes.map((n) => [n.id, Number.POSITIVE_INFINITY]));
  const f = new Map<string, number>(graph.nodes.map((n) => [n.id, Number.POSITIVE_INFINITY]));
  const open = new Set<string>([start]);
  const closed = new Set<string>();
  const cameFrom = new Map<string, string | null>([[start, null]]);
  const steps: SearchStep[] = [];
  let frontierPeak = 1;

  const heuristic = (id: string) => {
    const a = nodes.get(id)!;
    const b = nodes.get(goal)!;
    return haversineMeters(a.lat, a.lng, b.lat, b.lng);
  };

  g.set(start, 0);
  f.set(start, heuristic(start));

  while (open.size) {
    frontierPeak = Math.max(frontierPeak, open.size);
    const current = [...open].sort((a, b) => (f.get(a) ?? Infinity) - (f.get(b) ?? Infinity))[0];

    steps.push({
      current,
      frontier: [...open],
      visited: [...closed],
      explanation: 'A* prioritizes nodes with low f(n)=g(n)+h(n), reducing unnecessary exploration.',
      scoreBreakdown: {
        g: g.get(current),
        h: heuristic(current),
        f: f.get(current),
      },
    });

    if (current === goal) break;

    open.delete(current);
    closed.add(current);

    for (const edge of adjacency.get(current) ?? []) {
      if (closed.has(edge.to)) continue;
      const tentativeG = (g.get(current) ?? Infinity) + edge.cost;
      if (tentativeG < (g.get(edge.to) ?? Infinity)) {
        cameFrom.set(edge.to, current);
        g.set(edge.to, tentativeG);
        f.set(edge.to, tentativeG + heuristic(edge.to));
        open.add(edge.to);
      }
    }
  }

  const path = reconstructPath(cameFrom, goal);
  const timeMs = performance.now() - t0;

  return {
    algorithm: 'astar',
    path,
    pathCost: g.get(goal) ?? Number.POSITIVE_INFINITY,
    nodesExplored: closed.size,
    timeMs,
    memoryBytes: estimateMemory(steps.length, frontierPeak),
    efficiencyScore: Number((15000 / (1 + timeMs + closed.size)).toFixed(2)),
    steps,
  };
}
