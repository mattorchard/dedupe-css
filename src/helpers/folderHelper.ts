export interface PathNode {
	name: string;
	children: PathNode[];
}

const asNode = (name: string): PathNode => ({ name, children: [] });

export const getDirectoryTree = async (
	rootFolder: FileSystemDirectoryHandle,
	files: FileSystemFileHandle[]
) => {
	const root: PathNode = asNode(rootFolder.name);
	await Promise.all(
		files.map(async (file) => {
			const segments = await rootFolder.resolve(file);
			let node = root;
			segments?.forEach((segment) => {
				const existingNode = node.children.find((n) => n.name === segment);
				if (existingNode) {
					node = existingNode;
				} else {
					const newNode = asNode(segment);
					node.children.push(newNode);
					node = newNode;
				}
			});
		})
	);
	return root;
};
