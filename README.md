# PathMind 2.0 — AI Pathfinding Visualization Dashboard

PathMind is now a modern React + TypeScript platform for **interactive, educational, and performance-focused** comparison of graph search and reinforcement learning algorithms on map coordinates.

## Highlights

- ✅ Vite + React + TypeScript architecture
- ✅ TailwindCSS glassmorphism dashboard with dark/light mode
- ✅ Framer Motion animated educational panel
- ✅ Zustand global state management
- ✅ Mapbox GL map rendering
- ✅ Recharts metrics visualization
- ✅ Web Worker algorithm execution (non-blocking UI)
- ✅ Modular algorithms:
  - `BFS`
  - `Dijkstra`
  - `A*` (with dynamic `g(n), h(n), f(n)`)
  - `Q-Learning` (exploration vs exploitation narratives)

## Project Structure

```txt
src/
  components/
    ControlPanel.tsx
    MapPanel.tsx
    ComparisonPanel.tsx
    TrainingPanel.tsx
  algorithms/
    bfs.ts
    dijkstra.ts
    astar.ts
    qlearning.ts
  store/
    usePathmindStore.ts
  hooks/
    useAlgorithmRunner.ts
  utils/
    graph.ts
  visualization/
    scenario.ts
  workers/
    algorithmWorker.ts
  types/
    graph.ts
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Add env file:

```bash
cp .env.example .env
```

Set your Mapbox token:

```env
VITE_MAPBOX_TOKEN=your_mapbox_public_token
```

3. Start dev server:

```bash
npm run dev
```

4. Build production bundle:

```bash
npm run build
```

## Educational Mode

- Step-by-step replay
- Pause / Resume / speed control
- Dynamic pseudocode highlighting
- Real-time explanation text
- A* heuristic breakdown display (`g`, `h`, `f`)

## Comparison Metrics

- Path cost
- Nodes explored
- Time taken
- Approx. memory usage
- Efficiency score
- Best algorithm highlighted

## Notes

- Uses synthetic map graph generation around real-world coordinates for deterministic demos.
- Extend `src/visualization/scenario.ts` to load OSRM-backed routing graphs/cached API responses for production deployments.
