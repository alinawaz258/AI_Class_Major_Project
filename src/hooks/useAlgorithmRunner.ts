import { useCallback } from 'react';
import { usePathmindStore } from '../store/usePathmindStore';
import { AlgorithmResult } from '../types/graph';

export const useAlgorithmRunner = () => {
  const { graph, start, goal, selected, setResults } = usePathmindStore();

  return useCallback(async () => {
    const runs = selected.map(
      (algorithm) =>
        new Promise<AlgorithmResult>((resolve) => {
          const worker = new Worker(new URL('../workers/algorithmWorker.ts', import.meta.url), { type: 'module' });
          worker.onmessage = (message: MessageEvent<AlgorithmResult>) => {
            resolve(message.data);
            worker.terminate();
          };
          worker.postMessage({ graph, start, goal, algorithm });
        }),
    );
    const result = await Promise.all(runs);
    setResults(result);
  }, [graph, start, goal, selected, setResults]);
};
