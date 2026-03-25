import { GraphData } from '../types/graph';
import { haversineMeters } from '../utils/graph';

export const buildScenarioGraph = (size: number): GraphData => {
  const baseLat = 37.7749;
  const baseLng = -122.4194;
  const nodes = Array.from({ length: size }, (_, i) => ({
    id: `N${i}`,
    lat: baseLat + 0.02 * Math.sin(i / 3),
    lng: baseLng + 0.02 * Math.cos(i / 4),
  }));

  const edges = [] as GraphData['edges'];
  for (let i = 0; i < size - 1; i++) {
    const j = i + 1;
    edges.push({
      from: `N${i}`,
      to: `N${j}`,
      cost: haversineMeters(nodes[i].lat, nodes[i].lng, nodes[j].lat, nodes[j].lng),
    });
    if (i + 3 < size) {
      edges.push({
        from: `N${i}`,
        to: `N${i + 3}`,
        cost: haversineMeters(nodes[i].lat, nodes[i].lng, nodes[i + 3].lat, nodes[i + 3].lng) * 1.1,
      });
    }
  }
  return { nodes, edges };
};
