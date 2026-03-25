/// <reference lib="webworker" />
import { runAStar } from '../algorithms/astar';
import { runBfs } from '../algorithms/bfs';
import { runDijkstra } from '../algorithms/dijkstra';
import { runQLearning } from '../algorithms/qlearning';
import { AlgorithmKey, GraphData } from '../types/graph';

self.onmessage = (event: MessageEvent<{ graph: GraphData; start: string; goal: string; algorithm: AlgorithmKey }>) => {
  const { graph, start, goal, algorithm } = event.data;

  const result =
    algorithm === 'bfs'
      ? runBfs(graph, start, goal)
      : algorithm === 'dijkstra'
        ? runDijkstra(graph, start, goal)
        : algorithm === 'astar'
          ? runAStar(graph, start, goal)
          : runQLearning(graph, start, goal);

  postMessage(result);
};

export {};
