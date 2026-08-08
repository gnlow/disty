const sep = ";{Graph};"
export class Graph<T> {
    readonly raw: Map<string, T>
    constructor(
        raw: Iterable<[string, T]> = new Map<string, T>,
    ) {
        this.raw = new Map(raw)
    }
    add(a: string, b: string, n: T) {
        return new Graph(new Map([
            ...this.raw,
            [
                Graph.getEKey(a, b),
                n,
            ],
        ]))
    }
    union(...gs: Graph<T>[]) {
        return Graph.union(this, ...gs)
    }
    static union<T>(...gs: Graph<T>[]) {
        return new Graph(new Map(gs.flatMap(g => [...g.raw])))
    }
    getNeighbors(key: string) {
        return this.raw.keys()
            .filter(x => x.split(sep).includes(key))
            .map(x => x.split(sep).filter(x => x != key)[0])
            .toArray()
    }
    getConnectedNodes(from: string, except = from): string[] {
        return [from, ...this.getNeighbors(from)
            .filter(x => x != except)
            .flatMap(next => this.getConnectedNodes(next, from))]
    }
    dfs(from: string, to: string, visited = new Set<string>): string[][] {
        if (from == to) return [[to]]
        const neighbors = this.getNeighbors(from)
            .filter(x => !visited.has(x))
        if (neighbors.length == 0) return []
        
        return neighbors
            .flatMap(x => this.dfs(x, to, new Set([...visited, from])))
            .map(x => [from, ...x])
    }
    dfsW(from: string, to: string) {
        return this.dfs(from, to).map(path => this.vs2ws(path))
    }
    pathRule(this: Graph<number>, from: string, to: string) {
        return this.dfsW(from, to)
            .map(path => path.reduce((a, b) => a*b, 1))
            .reduce((a, b) => a+b, 0)
    }
    vs2es(vs: string[]) {
        return vs.slice(0, -1).keys().toArray()
            .map(i => Graph.getEKey(vs[i], vs[i+1]))
    }
    vs2ws(vs: string[]) {
        return this.vs2es(vs).map(e => this.raw.get(e)!)
    }
    static getEKey(a: string, b: string) {
        return [a, b].toSorted().join(sep)
    }
}
