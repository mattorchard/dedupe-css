import { forEachStreamsContent } from '../helpers/fileHelpers';
import { getDuplicatedValues } from '../helpers/cssParser';

console.log('LRT WORKER CREATED');

const taskHandler: Record<string, (...args: any[]) => Promise<any>> = {
	echo: async (input) => input,
	parseCss: async (streams: ReadableStream[]) => getDuplicatedValues(forEachStreamsContent(streams))
};

self.onmessage = async (event) => {
	const { type, input, taskId } = event.data;
	console.debug(`Worker received message`, { type, input, taskId });
	try {
		const result = await taskHandler[type](input);
		console.debug('Worker got result', result);
		self.postMessage({ taskId, result });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown Error';
		console.error(`Error`, error);
		self.postMessage({ taskId, errorMessage });
	}
};

export default {};
