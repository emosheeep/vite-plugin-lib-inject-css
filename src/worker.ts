import { workerData, parentPort, Worker, isMainThread } from 'worker_threads';
import { type Edge, analyzeGraph, FullAnalysisResult } from 'graph-cycles';
import { fileURLToPath } from 'url';
import { path } from 'zx';
import fastglob from 'fast-glob';
import { walkFile } from './ast';
import { getRealPathOfSpecifier } from './utils';

interface GlobFiles {
  exec: 'glob-files';
  pattern: string;
  ignore: string[];
  cwd: string;
}

type PullOutProgressCallback = (filename: string, index: number, total: number) => void;

interface PullOut {
  exec: 'pull-out';
  cwd: string;
  absolute: boolean;
  files: string[];
  alias: Record<string, string>;
  onProgress?: PullOutProgressCallback;
}

interface Analyze {
  exec: 'analyze';
  entries: Edge[];
}

type WorkerData = GlobFiles | PullOut | Analyze;

if (!isMainThread) {
  const data: WorkerData = workerData;
  if (data.exec === 'glob-files') {
    parentPort?.postMessage({
      type: 'finish',
      value: fastglob.sync(data.pattern, {
        absolute: true,
        cwd: data.cwd,
        ignore: data.ignore,
      }),
    });
  } else if (data.exec === 'pull-out') {
    const { files, cwd, absolute, alias } = data;
    const entries: Edge[] = [];

    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const relFileName = path.relative(cwd, filename);
      parentPort?.postMessage({ type: 'progress', value: [relFileName, i, files.length] });
      const deps: string[] = [];
      const visitor = value => (value = getRealPathOfSpecifier(filename, value, alias)) && deps.push(value);
      walkFile(filename, { onExportFrom: visitor, onImportFrom: visitor });
      entries.push(
        absolute
          ? [filename, deps]
          : [relFileName, deps.map(v => path.relative(cwd, v))],
      );
    }
    parentPort?.postMessage({ type: 'finish', value: entries });
  } else if (data.exec === 'analyze') {
    parentPort?.postMessage({
      type: 'finish',
      value: analyzeGraph(data.entries).cycles,
    });
  } else {
    throw new Error('Type error with `exec`');
  }
}

type MessageEventParam =
  { type: 'progress', value: Parameters<PullOutProgressCallback> }
  | { type: 'finish'; value: any };

type WorkerOutput<E extends WorkerData['exec']> =
  E extends 'glob-files'
    ? string[]
    : E extends 'pull-out'
      ? Edge[]
      : E extends 'analyze'
        ? FullAnalysisResult['cycles']
        : never;

type WorkerOptions<T extends WorkerData['exec']> =
   T extends 'pull-out'
     ? { onProgress?: PullOutProgressCallback }
     : never;

export function callWorker<
  T extends WorkerData,
  Exec extends T['exec'] = T['exec'],
>(workerData: T, options?: WorkerOptions<Exec>) {
  return new Promise<WorkerOutput<Exec>>((resolve, reject) => {
    const worker = new Worker(
      fileURLToPath(import.meta.url),
      { workerData },
    );
    worker.on('error', reject);
    worker.on('message', (data: MessageEventParam) => {
      if (data.type === 'finish') {
        resolve(data.value);
        worker.terminate();
      } else if (data.type === 'progress') {
        options?.onProgress?.(...data.value);
      }
    });
  });
}
