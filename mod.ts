export const arr =
(n: number) =>
    new Array(n).keys().toArray()

export const range =
(a: number, b: number) =>
    arr(b-a).map(x => x+a)
    
export type RecordLike<K, V> =
    K extends number ? V[] :
    K extends string ? Record<K, V> :
    V[] | Record<string, V>
    
export const RecordLike = {
    mapV:
    <K, V, V2>
    (f: (v: V) => V2) =>
    (r: RecordLike<K, V>) => (
        Array.isArray(r)
            ? r.map(f)
            : Object.fromEntries(
                (Object.entries(r)).map(([k, v]) =>
                    [k, f(v)]
                )
            )
    ) as unknown as RecordLike<K, V2>,
}
    
export abstract class Dist<A> {
    abstract pick(): A
    map<B>(f: (a: A) => B) {
        return new FuncDist(() =>
            f(this.pick())
        )
    }
    filter(f: (a: A) => boolean) {
        const rf =
        (): A => {
            const p = this.pick()
            return f(p) ? p : rf()
        }
        return new FuncDist(rf)
    }
    cross<Ts extends unknown[]>(
        ...dists: { [K in keyof Ts]: Dist<Ts[K]> }
    ) {
        return Dist.cross<[A, ...Ts]>([this, ...dists])
    }
    concat(this: Dist<string>, ...dists: Dist<string>[]) {
        return Dist.concat(this, ...dists)
    }
    flat<T>(this: Dist<Dist<T>>) {
        return this.map(x => x.pick())
    }
    
    static cross<Ts extends RecordLike<unknown, unknown>>(
        dists: { [K in keyof Ts]: Dist<Ts[K]> },
    ) {
        return new FuncDist(() =>
            RecordLike.mapV(<A>(dist: Dist<A>) =>
                dist.pick()
            )(dists) as Ts
        )
    }
    static concat(...dists: Dist<string>[]) {
        return Dist.cross(dists).map(x => x.join(""))
    }
    static u<A>(as: A[]) {
        return new UniformDist(as)
    }
    static w<A>(aws: [A, number][]) {
        const ws = aws
            .map(([_, w]) => w)
        const is = ws.reduce(
            (a, b) =>
                [...a, a.at(-1)!+b],
            [0],
        ) 
        const wSum = is.at(-1)!
        return new FuncDist(() => {
            const seed = Math.random()*wSum
            return aws[is.findIndex(i => seed < i)-1][0]
        })
    }
    static p(p: number) {
        return new FuncDist(() =>
            Math.random() < p
        )
    }
    static range(a: number, b: number) {
        return Dist.u(range(a, b))
    }
    static t<Ts extends unknown[]>(
        strings: TemplateStringsArray,
        ...dists: { [K in keyof Ts]: Dist<Ts[K]> }
    ) {
        return Dist.cross(dists)
            .map(ts => strings.reduce((a, b, i) =>
                a + b + (i<ts.length ? ts[i] : ""),
                "",
            ))
    }
}

export class FuncDist<A> extends Dist<A> {
    constructor(public pick: () => A) {
        super()
    }
}

export class UniformDist<A> extends Dist<A> {
    constructor(public as: A[]) {
        super()
    }
    pick() {
        return this.as[Math.floor(Math.random()*this.as.length)]
    }
    or(...as: A[]) {
        return new UniformDist([...this.as, ...as])
    }
}
