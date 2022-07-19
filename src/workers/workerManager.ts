import type { Result, SearchResult } from '../helpers/domainTypes';
import LrtWorker from './lrtWorker?worker';
import type { TaskReply } from './tasks';

const ONE_MINUTE = 60_000;
const createId = () => Math.random().toString();

interface RemotePromise<T> {
	resolve: (result: T) => void;
	reject: (error: Error) => void;
}

class WorkerManager {
	private worker: Worker | null = null;
	private mailbox: Map<string, RemotePromise<unknown>> = new Map();

	private prepare() {
		if (this.worker) return;
		this.worker = new LrtWorker();
		this.worker.onmessage = (event) => this.onmessage(event.data);
		this.worker.onerror = (event) => console.error('Worker error', event);
		this.worker.onmessageerror = (event) => console.error('Worker message error', event);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		window._lrtWorker = this.worker;
	}

	private async runTask<T>(
		type: string,
		input: unknown,
		transfer?: Transferable[],
		timeout = ONE_MINUTE
	): Promise<T> {
		this.prepare();
		const taskId = createId();
		const replyPromise = this.waitForReply(taskId);

		if (transfer) this.worker!.postMessage({ taskId, type, input }, transfer);
		else this.worker!.postMessage({ taskId, type, input });

		try {
			return (await Promise.race([replyPromise, this.setupTimeout(timeout)])) as T;
		} finally {
			this.mailbox.delete(taskId);
		}
	}

	private async waitForReply(taskId: string) {
		return new Promise((resolve, reject) => {
			this.mailbox.set(taskId, { resolve, reject });
		});
	}

	private async setupTimeout(timeout: number) {
		return new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Operation timed out after ${timeout}`)), timeout)
		);
	}

	private onmessage(data: TaskReply) {
		const removePromise = this.mailbox.get(data.taskId);

		if (!removePromise) {
			console.warn('Received unexpected reply');
			return;
		}
		if (data.errorMessage) {
			removePromise.reject(new Error(data.errorMessage));
		} else {
			removePromise.resolve(data.result);
		}
	}

	public async parseCss(streams: ReadableStream[]): Promise<Result[]> {
		return await this.runTask('parseCss', streams, streams as unknown as Transferable[]);
	}

	public async searchCss(query: string, streams: ReadableStream[]): Promise<SearchResult[]> {
		return await this.runTask(
			'searchCss',
			{ query, streams },
			streams as unknown as Transferable[]
		);
	}

	public async echo<T>(input: T): Promise<T> {
		return (await this.runTask('echo', input)) as T;
	}
}

export const workerManager = new WorkerManager();
