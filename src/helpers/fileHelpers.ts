const findFilesInternal = async (
	folder: FileSystemDirectoryHandle,
	filePredicate: (file: FileSystemFileHandle) => boolean,
	folderPredicate: (folder: FileSystemDirectoryHandle) => boolean,
	result: FileSystemFileHandle[],
	depth = 0
) => {
	if (depth > 10) return;
	for await (const child of folder.values()) {
		if (child.kind === 'directory') {
			if (folderPredicate(child))
				await findFilesInternal(child, filePredicate, folderPredicate, result, depth + 1);
		} else if (child.kind === 'file') {
			if (filePredicate(child)) result.push(child);
		}
	}
};

const findFiles = async (
	folder: FileSystemDirectoryHandle,
	filePredicate: (file: FileSystemFileHandle) => boolean,
	folderPredicate: (folder: FileSystemDirectoryHandle) => boolean
) => {
	const files = new Array<FileSystemFileHandle>();
	await findFilesInternal(folder, filePredicate, folderPredicate, files);
	return files;
};

const getExtension = (name: string) => {
	const lastDotIndex = name.lastIndexOf('.');
	const extension = name.substring(lastDotIndex + 1);
	return extension.toLowerCase();
};

const getExtensionMatcher = (extensions: string[]) => {
	const extensionSet = new Set(extensions.map((e) => e.toLowerCase()));
	return (file: FileSystemFileHandle) => extensionSet.has(getExtension(file.name));
};

const folderIgnore = new Set(['node_modules', '.idea', '.vscode', 'build', 'dist', '.yarn']);

export const findCssFiles = async (folder: FileSystemDirectoryHandle) =>
	findFiles(
		folder,
		getExtensionMatcher(['css', 'scss', 'sass', 'pcss', 'less']),
		(folder) => !folderIgnore.has(folder.name.toLowerCase())
	);

const readTextFile = async (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () =>
			typeof reader.result === 'string'
				? resolve(reader.result)
				: reject(new Error(`Error reading file ${file.name}`));
		reader.onerror = () => reject(new Error(`Error reading file ${file.name}`));
		reader.onabort = () => reject(new Error(`Error abort while reading file ${file.name}`));
		reader.readAsText(file);
	});

export const readTextFileHandle = async (fileHandle: FileSystemFileHandle) =>
	await readTextFile(await fileHandle.getFile());

const readTextStream = (stream: ReadableStream): Promise<string> => new Response(stream).text();

export async function* forEachStreamsContent(streams: ReadableStream[]): AsyncIterable<string> {
	for (const stream of streams) {
		yield await readTextStream(stream);
	}
}

export const handleAsStream = async (handle: FileSystemFileHandle): Promise<ReadableStream> => {
	const file = await handle.getFile();
	const url = URL.createObjectURL(file);
	try {
		const response = await fetch(url);
		if (!response.ok || !response.body) throw new Error(`Cannot read file ${handle.name}`);
		return response.body;
	} finally {
		URL.revokeObjectURL(url);
	}
};
