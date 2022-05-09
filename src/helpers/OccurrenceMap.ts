export class OccurrenceMap<KeyType> implements Omit<Map<KeyType, number>, 'set'> {
	private readonly map = new Map<KeyType, number>();

	clear(): void {
		this.map.clear();
	}
	delete(key: KeyType): boolean {
		return this.map.delete(key);
	}
	forEach(
		callbackfn: (value: number, key: KeyType, map: Map<KeyType, number>) => void,
		thisArg?: any
	): void {
		return this.map.forEach(callbackfn, thisArg);
	}
	get(key: KeyType): number {
		return this.map.get(key) ?? 0;
	}
	has(key: KeyType): boolean {
		return this.map.has(key);
	}
	get size(): number {
		return this.map.size;
	}
	entries(): IterableIterator<[KeyType, number]> {
		return this.map.entries();
	}
	keys(): IterableIterator<KeyType> {
		return this.map.keys();
	}
	values(): IterableIterator<number> {
		return this.map.values();
	}
	[Symbol.iterator](): IterableIterator<[KeyType, number]> {
		return this.map.entries();
	}
	get [Symbol.toStringTag]() {
		return this.map.toString();
	}

	increment(key: KeyType, amount = 1): number {
		const newValue = this.get(key) + amount;
		this.map.set(key, newValue);
		return newValue;
	}
}
