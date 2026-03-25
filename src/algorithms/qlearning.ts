import { AlgorithmResult, GraphData, SearchStep } from '../types/graph';
import { buildAdjacency, estimateMemory } from '../utils/graph';

export function runQLearning(graph: GraphData, start: string, goal: string, episodes = 120): AlgorithmResult {
  const t0 = performance.now();
  const adjacency = buildAdjacency(graph);
  const q = new Map<string, number>();
  const steps: SearchStep[] = [];

  const alpha = 0.35;
  const gamma = 0.9;
  let epsilon = 0.4;

  const actKey = (s: string, a: string) => `${s}->${a}`;
  const bestAction = (s: string) => {
    const options = adjacency.get(s) ?? [];
    return options.sort((x, y) => (q.get(actKey(s, y.to)) ?? 0) - (q.get(actKey(s, x.to)) ?? 0))[0]?.to;
  };

  for (let e = 0; e < episodes; e++) {
    let current = start;
    const visited = new Set<string>([start]);

    for (let i = 0; i < graph.nodes.length * 2; i++) {
      const neighbors = adjacency.get(current) ?? [];
      if (!neighbors.length) break;
      const explore = Math.random() < epsilon;
      const next = explore
        ? neighbors[Math.floor(Math.random() * neighbors.length)].to
        : bestAction(current) ?? neighbors[0].to;

      const reward = next === goal ? 120 : -1;
      const oldQ = q.get(actKey(current, next)) ?? 0;
      const nextBest = q.get(actKey(next, bestAction(next) ?? next)) ?? 0;
      q.set(actKey(current, next), oldQ + alpha * (reward + gamma * nextBest - oldQ));

      steps.push({
        current,
        frontier: neighbors.map((n) => n.to),
        visited: [...visited],
        explanation: explore
          ? 'Q-Learning explores to improve policy coverage (exploration mode).'
          : 'Q-Learning exploits current best Q-values to refine path policy (exploitation mode).',
      });

      current = next;
      visited.add(current);
      if (current === goal) break;
    }

    epsilon = Math.max(0.05, epsilon * 0.98);
  }

  const policyPath: string[] = [start];
  let cursor = start;
  let guard = 0;
  while (cursor !== goal && guard < graph.nodes.length * 2) {
    const move = bestAction(cursor);
    if (!move) break;
    policyPath.push(move);
    cursor = move;
    guard += 1;
  }

  const timeMs = performance.now() - t0;

  return {
    algorithm: 'qlearning',
    path: policyPath,
    pathCost: Math.max(0, policyPath.length - 1),
    nodesExplored: new Set(policyPath).size,
    timeMs,
    memoryBytes: estimateMemory(steps.length, graph.nodes.length),
    efficiencyScore: Number((9000 / (1 + timeMs + policyPath.length)).toFixed(2)),
    steps,
  };
}
