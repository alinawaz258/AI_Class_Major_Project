import { create } from 'zustand';
import { AlgorithmKey, AlgorithmResult, GraphData } from '../types/graph';
import { buildScenarioGraph } from '../visualization/scenario';

interface PathmindState {
  darkMode: boolean;
  graphDensity: number;
  selected: AlgorithmKey[];
  graph: GraphData;
  start: string;
  goal: string;
  results: AlgorithmResult[];
  activeStep: number;
  speedMs: number;
  playing: boolean;
  setDarkMode: (v: boolean) => void;
  setDensity: (v: number) => void;
  toggleAlgorithm: (a: AlgorithmKey) => void;
  setResults: (r: AlgorithmResult[]) => void;
  setStep: (v: number) => void;
  setSpeed: (v: number) => void;
  setPlaying: (v: boolean) => void;
}

export const usePathmindStore = create<PathmindState>((set, get) => ({
  darkMode: true,
  graphDensity: 18,
  selected: ['bfs', 'dijkstra', 'astar', 'qlearning'],
  graph: buildScenarioGraph(18),
  start: 'N0',
  goal: 'N17',
  results: [],
  activeStep: 0,
  speedMs: 400,
  playing: false,
  setDarkMode: (darkMode) => set({ darkMode }),
  setDensity: (graphDensity) => {
    const graph = buildScenarioGraph(graphDensity);
    set({ graphDensity, graph, start: 'N0', goal: `N${Math.max(1, graphDensity - 1)}`, results: [] });
  },
  toggleAlgorithm: (a) => {
    const current = get().selected;
    set({ selected: current.includes(a) ? current.filter((x) => x !== a) : [...current, a] });
  },
  setResults: (results) => set({ results, activeStep: 0 }),
  setStep: (activeStep) => set({ activeStep }),
  setSpeed: (speedMs) => set({ speedMs }),
  setPlaying: (playing) => set({ playing }),
}));
