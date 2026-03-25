import { GraphData } from '../types/graph';

export const haversineMeters = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

export const buildAdjacency = (graph: GraphData) => {
  const map = new Map<string, Array<{ to: string; cost: number }>>();
  for (const node of graph.nodes) map.set(node.id, []);
  for (const edge of graph.edges) {
    map.get(edge.from)?.push({ to: edge.to, cost: edge.cost });
    map.get(edge.to)?.push({ to: edge.from, cost: edge.cost });
  }
  return map;
};

export const estimateMemory = (steps: number, frontierPeak: number) => (steps * 64 + frontierPeak * 32);

export const reconstructPath = (cameFrom: Map<string, string | null>, goal: string) => {
  const path: string[] = [];
  let cursor: string | null = goal;
  while (cursor) {
    path.push(cursor);
    cursor = cameFrom.get(cursor) ?? null;
  }
  return path.reverse();
};
