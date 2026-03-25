import { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { usePathmindStore } from '../store/usePathmindStore';

const palette: Record<string, string> = {
  bfs: '#ef4444',
  dijkstra: '#f97316',
  astar: '#a855f7',
  qlearning: '#3b82f6',
};

export function MapPanel() {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { graph, results } = usePathmindStore();

  const center = useMemo(() => [graph.nodes[0]?.lng ?? 0, graph.nodes[0]?.lat ?? 0] as [number, number], [graph]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
    mapRef.current = new mapboxgl.Map({
      container: ref.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom: 12,
    });
    return () => mapRef.current?.remove();
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const result of results) {
      const id = `path-${result.algorithm}`;
      const coords = result.path
        .map((pid) => graph.nodes.find((n) => n.id === pid))
        .filter(Boolean)
        .map((n) => [n!.lng, n!.lat]);
      if (!coords.length) continue;
      const data = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } } as const;
      if (map.getSource(id)) {
        (map.getSource(id) as mapboxgl.GeoJSONSource).setData(data as any);
      } else {
        map.addSource(id, { type: 'geojson', data: data as any });
        map.addLayer({
          id,
          type: 'line',
          source: id,
          paint: { 'line-width': 4, 'line-color': palette[result.algorithm] },
        });
      }
    }
  }, [results, graph]);

  return <div className="glass p-2 h-[460px]"><div ref={ref} className="h-full w-full rounded-xl" /></div>;
}
