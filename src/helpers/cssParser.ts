import postcss, { type Plugin, type PluginCreator } from 'postcss';
import { OccurrenceMap } from './OccurrenceMap';
import ignoreListRaw from './cssValueExcludeList.json';
import type { Result } from './domainTypes';

const sanitizeValue = (value: string): string => {
	return value.toLowerCase().trim();
};

const ignoreSet = new Set(ignoreListRaw);

const isDeclaringCustomProperty = (prop: string): boolean => prop.startsWith('--');

const isReferencingCustomProperty = (value: string): boolean => value.startsWith('var(');

const orList = (options: string[]) => `(?:${options.map((o) => `(?:${o})`).join('|')})`;
const measurementPattern = new RegExp(
	`^-?(?:\\d+\\.)?\\d+\\s*${orList(['px', '%', 'rem', 'em', 'ch', 'vmin', 'vmax', 'vh', 'vw'])}?$`
);

const isMeasurement = (value: string): boolean => measurementPattern.test(value);

const MIN_VALUE_LENGTH = 3;

export const getDuplicatedValues = async (inputs: AsyncIterable<string>): Promise<Result[]> => {
	const declarationValues = new OccurrenceMap<string>();

	const plugin: PluginCreator<void> = (): Plugin => {
		return {
			postcssPlugin: 'scoop-values',
			Declaration(decl) {
				if (isDeclaringCustomProperty(decl.prop)) return;

				const cleanValue = sanitizeValue(decl.value);
				if (cleanValue.length < MIN_VALUE_LENGTH) return;
				if (isReferencingCustomProperty(cleanValue)) return;
				if (ignoreSet.has(cleanValue)) return;
				if (isMeasurement(cleanValue)) return;

				declarationValues.increment(cleanValue);
			}
		};
	};
	plugin.postcss = true;
	const processor = postcss([plugin]);
	let inputIndex = 0;
	for await (const input of inputs) {
		const fileName = `Simulated file ${inputIndex + 1}`;
		await processor.process(input, { from: fileName });
		inputIndex += 1;
	}

	return [...declarationValues.entries()]
		.map(([text, count]) => ({ text, count }))
		.filter(({ count }) => count > 1)
		.sort((a, b) => b.count - a.count);
};
