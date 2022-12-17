import { workerData, parentPort, Worker, isMainThread } from 'worker_threads';
import { type Edge, analyzeGraph, FullAnalysisResult } from 'graph-cycles';
import { path } from 'zx';
import { fileURLToPath } from 'url';
import fastglob from 'fast-glob';
import { walkFile } from './ast';
import { getRealPathOfSpecifier } from './utils';

declare module 'worker_threads' {
  interface MessagePort {
    postMessage<T>(value: T)
  }
}

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
}

interface Analyze {
  exec: 'analyze';
  entries: Edge[];
}

type WorkerData = GlobFiles | PullOut | Analyze;
type ExecType = WorkerData['exec'];

interface WorkerOptionsMap {
  'pull-out': {
    onProgress?: PullOutProgressCallback;
  }
}

type WorkerOptions<T extends ExecType> =
  T extends keyof WorkerOptionsMap
    ? WorkerOptionsMap[T]
    : never;

interface WorkerOutput {
  'pull-out': Edge[];
  'glob-files': string[];
  'analyze': FullAnalysisResult['cycles'];
}

type WorkerEvent<T extends Record<string, any>> = { [K in keyof T]: { type: K; value: T[K] }}[keyof T];

type MessageEventOrigin = {
  [name in keyof WorkerOutput]: WorkerEvent<{ finish: WorkerOutput[name]; }>
};

interface MessageEventExtra {
  'pull-out': WorkerEvent<{
    progress: Parameters<PullOutProgressCallback>
  }>
}

type MessageEvent<T extends ExecType> =
  T extends keyof MessageEventOrigin
    ? T extends keyof MessageEventExtra
      ? MessageEventOrigin[T] | MessageEventExtra[T]
      : MessageEventOrigin[T]
    : never;

if (!isMainThread) {
  const data: WorkerData = workerData;
  if (data.exec === 'glob-files') {
    parentPort?.postMessage<MessageEvent<'glob-files'>>({
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
    type ParamType = MessageEvent<'pull-out'>;

    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const relFileName = path.relative(cwd, filename);

      parentPort?.postMessage<ParamType>({
        type: 'progress',
        value: [relFileName, i, files.length],
      });

      const deps: string[] = [];
      const visitor = value => (value = getRealPathOfSpecifier(filename, value, alias)) && deps.push(value);
      walkFile(filename, { onExportFrom: visitor, onImportFrom: visitor });
      entries.push(
        absolute
          ? [filename, deps]
          : [relFileName, deps.map(v => path.relative(cwd, v))],
      );
    }
    parentPort?.postMessage<ParamType>({ type: 'finish', value: entries });
  } else if (data.exec === 'analyze') {
    parentPort?.postMessage<MessageEvent<'analyze'>>({
      type: 'finish',
      value: analyzeGraph(data.entries).cycles,
    });
  } else {
    throw new Error('Type error with `exec`');
  }
}

export function callWorker<
  T extends WorkerData,
  E extends T['exec'] = T['exec'],
>(workerData: T, options?: WorkerOptions<E>) {
  return new Promise<WorkerOutput[E]>((resolve, reject) => {
    const worker = new Worker(
      fileURLToPath(import.meta.url),
      { workerData },
    );
    worker.on('error', reject);
    worker.on('message', (data: MessageEvent<E>) => {
      if (data.type === 'finish') {
        resolve(data.value as WorkerOutput[E]);
        worker.terminate();
      } else if (data.type === 'progress') {
        options?.onProgress?.(...data.value);
      }
    });
  });
}
