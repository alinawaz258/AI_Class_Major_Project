export type AlgorithmKey = 'bfs' | 'dijkstra' | 'astar' | 'qlearning';

export interface Coord {
  id: string;
  lat: number;
  lng: number;
}

export interface GraphNode extends Coord {
  weight?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  cost: number;
}

export interface SearchStep {
  current: string;
  frontier: string[];
  visited: string[];
  explanation: string;
  scoreBreakdown?: {
    g?: number;
    h?: number;
    f?: number;
  };
}

export interface AlgorithmResult {
  algorithm: AlgorithmKey;
  path: string[];
  pathCost: number;
  nodesExplored: number;
  timeMs: number;
  memoryBytes: number;
  efficiencyScore: number;
  steps: SearchStep[];
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
