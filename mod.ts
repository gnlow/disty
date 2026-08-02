import { xxHash32 } from "https://esm.sh/js-xxhash@5.0.1"

let keyCnt = 0
export const getKey =
() =>
    "DISTY_"+keyCnt++

export const hash =
(...args: (number | string)[]) =>
    xxHash32(args.join(";"), 0) / 2**32

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

export class Dist<A> {
    constructor(
        readonly f: (seed: number, destiny: Map<string, unknown>) => A,
        readonly key: null | string = getKey()+";"+f.toString(),
        readonly destiny = new Map<string, unknown>,
    ) {}
    pick(seed: number, destiny = this.destiny) {
        if (this.key == null)
            return this.f(seed, destiny)
        const dest = destiny.get(this.key)
        return (dest ?? this.f(hash(this.key, seed), destiny)) as A
    }
    
    map<B>(f: (a: A) => B) {
        return new Dist(
            (seed, destiny) =>
                f(this.pick(seed, destiny)),
            null,
            this.destiny,
        )
    }
    destine(a: A) {
        if (this.key == null)
            throw new Error("can't destine mapped dist")
        
        return new Dist(
            this.f,
            this.key,
            new Map([...this.destiny, [this.key, a]]),
        )
    }
    apriori<B>(dist: Dist<B>, b: B) {
        if (dist.key == null)
            throw new Error("can't destine mapped dist")
        return this.mergeDestiny(new Map([
            [dist.key, b]
        ]))
    }
    morph(d: Dist<A>) {
        return d.withKey(this.key).mergeDestiny(this.destiny)
    }
    filter(f: (a: A) => boolean) {
        const rf =
        (seed: number): A => {
            const p = this.pick(seed)
            return f(p) ? p : rf(seed)
        }
        return new Dist(rf, null, this.destiny)
    }
    cross<Ds extends unknown[]>(
        ...dists: Ds
    ) {
        return Dist.cross<[A, ...{ [K in keyof Ds]: Ds[K] extends Dist<infer T> ? T : Ds[K] }]>([this, ...dists] as any)
    }
    concat(this: Dist<string>, ...dists: Dist<string>[]) {
        return Dist.concat(this, ...dists)
            .withKey(null)
    }
    flat<T>(this: Dist<Dist<T>>) {
        return new Dist(
            seed =>
                this.pick(seed).pick(seed),
            null,
            this.destiny,
        )
    }
    flatMap<B>(f: (a: A) => Dist<B>): Dist<B> {
        return this.map(f).flat()
    }
    match<I extends A, O>(i: I, o: O) {
        return this.map(x =>
            (x == i ? o : x) as Exclude<A, I> | O
        )
    }
    flatMatch<I extends A, O>(i: I, o: Dist<O>) {
        return new Dist(
            seed => {
                const x = this.pick(seed)
                return x == i
                    ? o.pick(seed)
                    : x
            },
            null,
            this.destiny,
        )
    }
    withKey(key: null | string = getKey()) {
        return new Dist(this.f, key, this.destiny)
    }
    mergeDestiny(destiny: Map<string, unknown>) {
        return new Dist(
            this.f,
            this.key,
            new Map([...this.destiny, ...destiny]),
        )
    }
    
    static cross<Ts extends RecordLike<unknown, unknown>>(
        dists: { [K in keyof Ts]: Dist<Ts[K]> | Ts[K] },
    ) {
        const destiny =
            new Map(Object.values(dists).flatMap(<A>(dist: Dist<A> | A) =>
                dist instanceof Dist
                    ? [...dist.destiny]
                    : []
            ))
        return new Dist(
            seed =>
                RecordLike.mapV(<A>(dist: Dist<A> | A) =>
                    dist instanceof Dist
                        ? dist.pick(seed, destiny)
                        : dist
                )(dists) as Ts,
            null,
            destiny,
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
        return Dist.f(seed => {
            return aws[is.findIndex(i => seed*wSum < i)-1][0]
        })
    }
    static p(p: number) {
        return Dist.f(seed =>
            seed < p
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
    static f<A>(pick: (seed: number) => A) {
        return new Dist(pick)
    }
    static yet<A>() {
        return Dist.f<A>(() => {
            throw new Error("can't pick from abstract dist")
        })
    }
}

export class UniformDist<A> extends Dist<A> {
    constructor(public as: A[]) {
        super(
            seed =>
                this.as[Math.floor(seed*this.as.length)],
            getKey()+";"+as,
        )
    }
    or(...as: A[]) {
        return new UniformDist([...this.as, ...as])
    }
}
