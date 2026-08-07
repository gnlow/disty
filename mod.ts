import { xxHash32 } from "https://esm.sh/js-xxhash@5.0.1"
import { Graph } from "./src/Graph.ts"
import { getCondiDist } from "https://gnlow.dev/@learn/cholesky@0.1.0"

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

type Destiny = Map<string, Dist<unknown>>
interface Ctx {
    destiny: Destiny
    corr: Graph<number>
}

export type Z = number & { __brand: "Z" }

export const corrMulti =
(covMat: number[][], ...ds: [number, number][]) => {
    ds.forEach(([_x, r], i) => {
        covMat[i].push(r)
    })
    covMat.push([...ds.map(([_x, r]) => r), 1])
    const xs = ds.map(([x]) => x)
    const { mean, variance } = getCondiDist(covMat, xs)
    return Dist.n(mean, Math.sqrt(variance))
}

export const mergeCtx =
(...ctxs: Ctx[]) => ({
    destiny: new Map(ctxs.flatMap(ctx => [...ctx.destiny])),
    corr: new Graph(ctxs.flatMap(ctx => [...ctx.corr.raw])),
})

export class Dist<A> {
    constructor(
        readonly f: (seed: number, ctx: Ctx) => A,
        readonly key: null | string = getKey()+";"+f.toString(),
        readonly ctx = {
            destiny: new Map<string, Dist<unknown>>,
            corr: new Graph<number>,
        },
    ) {}
    pick(seed: number, ctx = this.ctx): A {
        if (this.key == null)
            return this.f(seed, mergeCtx(this.ctx, ctx))
        const dest = ctx.destiny.get(this.key)
        return (dest?.pick(seed, this.ctx) ?? this.f(hash(this.key, seed), ctx)) as A
    }
    
    map<B>(f: (a: A) => B) {
        return new Dist(
            (seed, ctx) =>
                f(this.pick(seed, ctx)),
            null,
            this.ctx,
        )
    }
    destine(a: A): Dist<A> {
        return this.apriori(this, a)
    }
    apriori<B>(dist: Dist<B>, b: B): Dist<A> {
        return this.aprioriDist(dist, Dist.u([b]))
    }
    morph(d: Dist<A>) {
        return this.aprioriDist(this, d)
    }
    aprioriDist<B>(dist: Dist<B>, b: Dist<B>) {
        if (dist.key == null)
            throw new Error("can't destine mapped dist")
        
        return this.mergeDestiny(new Map([
            [dist.key, b]
        ]))
    }
    co(this: Dist<Z>, dist: Dist<Z>, r: number) {
        const key = getKey()
        
        if (this.key == null || dist.key == null) {
            throw new Error("co with mapped dist not yet supported") // todo
        }
        
        return new Dist(
            (seed, ctx) => {
                const vs = ctx.corr.getConnectedNodes(key)
                if (!vs.every(v => ctx.destiny.get(v))) {
                    throw new Error("one or more dependency are not destined") // todo
                }
                corrMulti(
                    vs.map(v1 => vs.map(v2 =>
                        ctx.corr.dfsW(v1, v2)
                            .reduce((a, b) => a*b, 1)
                    )),
                    ...vs.map(v => [
                        ctx.destiny.get(v)!.pick(seed, ctx) as number,
                        ctx.corr.dfsW(v, key)
                            .reduce((a, b) => a*b, 1),
                    ] as [number, number]),
                ).pick(seed)
            },
            key,
            {
                ...this.ctx,
                corr: this.ctx.corr
                    .add(this.key, key, 1)
                    .add(key, dist.key, r),
            },
        )
    }
    filter(f: (a: A) => boolean) {
        const rf =
        (seed: number, ctx: Ctx): A => {
            const p = this.pick(seed, ctx)
            return f(p) ? p : rf(seed, ctx)
        }
        return new Dist(rf, null, this.ctx)
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
            (seed, ctx) =>
                this.pick(seed, ctx).pick(seed, ctx),
            null,
            this.ctx,
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
            (seed, ctx) => {
                const x = this.pick(seed, ctx)
                return x == i
                    ? o.pick(seed, ctx)
                    : x
            },
            null,
            this.ctx,
        )
    }
    withKey(key: null | string = getKey()) {
        return new Dist(this.f, key, this.ctx)
    }
    mergeDestiny(destiny: Destiny) {
        return new Dist(
            this.f,
            this.key,
            {
                ...this.ctx,
                destiny: new Map([...this.ctx.destiny, ...destiny]),
            },
        )
    }
    appendCorr(key1: string, key2: string, r: number) {
        return new Dist(
            this.f,
            this.key,
            {
                ...this.ctx,
                corr: this.ctx.corr.add(key1, key2, r),
            },
        )
    } 
    
    static cross<Ts extends RecordLike<unknown, unknown>>(
        dists: { [K in keyof Ts]: Dist<Ts[K]> | Ts[K] },
    ) {
        const ctxs = Object.values(dists)
            .filter(dist => dist instanceof Dist)
            .map(dist => dist.ctx)
        const ctxUp = {
            destiny: new Map(ctxs.flatMap(ctx => [...ctx.destiny])),
            corr: Graph.union<number>(...ctxs.flatMap(ctx => ctx.corr)),
        }
        
        return new Dist(
            (seed, ctx) =>
                RecordLike.mapV(<A>(dist: Dist<A> | A) =>
                    dist instanceof Dist
                        ? dist.pick(seed, ctx)
                        : dist
                )(dists) as Ts,
            null,
            ctxUp,
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
    static n(): Dist<Z>
    static n(mean?: number, sd?: number): Dist<number>
    static n(mean = 0, sd = 1) {
        return Dist.f(seed =>
            Math.sqrt(-2*Math.log(hash(111, seed)))
            *Math.cos(2*Math.PI*hash(222, seed))
        ).map(y => mean+y*sd as Z)
            .withKey() // todo: let mapped dist have unique key too
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
