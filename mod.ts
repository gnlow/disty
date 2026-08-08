import { xxHash32 } from "https://esm.sh/js-xxhash@5.0.1"
import { Graph } from "./src/Graph.ts"
import { getCondiDist } from "https://gnlow.dev/@learn/cholesky@0.1.0"
import { LogLogistic } from "https://gnlow.dev/@learn/log-logistic@0.1.0"

export const hash =
(...args: unknown[]) =>
    xxHash32(JSON.stringify(args), 0) / 2**32

export const hashStr =
(...args: unknown[]) =>
    xxHash32(JSON.stringify(args), 0)
        .toString(16)
        .padStart(8, "0")

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
        readonly f: (seed: string, ctx: Ctx) => A,
        readonly ctx: Ctx,
        readonly key: string,
        __CONSTRUCTOR_IS_INTERNAL_ONLY__: "OK"
    ) {}
    pick(seed: string, ctx = this.ctx): A {
        const dest = ctx.destiny.get(this.key)
        return (dest?.pick(seed, this.ctx) ?? this.f(seed, ctx)) as A
    }
    
    map<B>(f: (a: A) => B) {
        const d = Dist.rawF(
            (seed, ctx) => {
                Dist.pushKey(this.key)
                const res = f(this.pick(seed, ctx))
                Dist.popKey()
                return res
            },
            this.ctx,
        )
        d.isMapped = true
        return d
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
    isMapped = false
    aprioriDist<B>(dist: Dist<B>, b: Dist<B>) {
        if (dist.isMapped && dist != b)
            throw new Error("can't destine mapped dist")
        
        return this.mergeDestiny(new Map([
            [dist.key, b]
        ]))
    }
    co(this: Dist<Z>, dist: Dist<Z>, r: number) {
        return Dist.rawF(
            (seed, ctx) => {
                const vs = ctx.corr.getNeighbors(this.key)
                if (!vs.every(v => ctx.destiny.get(v))) {
                    throw new Error("one or more dependency are not destined") // todo
                }
                return corrMulti(
                    vs.map(v1 => vs.map(v2 =>
                        ctx.corr.pathRule(v1, v2)
                    )),
                    ...vs.map(v => [
                        ctx.destiny.get(v)!.pick(seed, ctx) as number,
                        ctx.corr.getW(v, this.key)!,
                    ] as [number, number]),
                ).pick(seed) as Z
            },
            {
                ...this.ctx,
                corr: this.ctx.corr
                    .add(this.key, dist.key, r),
            },
            this.key,
        )
        .aprioriDist(dist, dist)
    }
    filter(f: (a: A) => boolean) {
        const rf =
        (seed: string, ctx: Ctx): A => {
            const p = this.pick(seed, ctx)
            return f(p) ? p : rf(seed, ctx)
        }
        return Dist.rawF(rf, this.ctx)
    }
    cross<Ds extends unknown[]>(
        ...dists: Ds
    ) {
        return Dist.cross<[A, ...{ [K in keyof Ds]: Ds[K] extends Dist<infer T> ? T : Ds[K] }]>([this, ...dists] as any)
    }
    concat(this: Dist<string>, ...dists: Dist<string>[]) {
        return Dist.concat(this, ...dists)
    }
    flat<T>(this: Dist<Dist<T>>) {
        return Dist.rawF(
            (seed, ctx) =>
                this.pick(seed, ctx).pick(seed, ctx),
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
        return Dist.rawF(
            (seed, ctx) => {
                const x = this.pick(seed, ctx)
                return x == i
                    ? o.pick(seed, ctx)
                    : x
            },
            this.ctx,
        )
    }
    branch(key = Dist.getKey()) {
        return Dist.rawF(
            (seed, ctx) =>
                this.f(hashStr(key, seed), ctx),
            this.ctx,
            key,
        )
    }
    
    mergeDestiny(destiny: Destiny) {
        return Dist.rawF(
            this.f,
            {
                ...this.ctx,
                destiny: new Map([...this.ctx.destiny, ...destiny]),
            },
            this.key,
        )
    }
    appendCorr(key1: string, key2: string, r: number) {
        return Dist.rawF(
            this.f,
            {
                ...this.ctx,
                corr: this.ctx.corr.add(key1, key2, r),
            },
            this.key,
        )
    }
    sample(n: number) {
        return arr(n).map(i => this.pick("sample"+i))
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
        
        return Dist.rawF(
            (seed, ctx) =>
                RecordLike.mapV(<A>(dist: Dist<A> | A) =>
                    dist instanceof Dist
                        ? dist.pick(seed, ctx)
                        : dist
                )(dists) as Ts,
            ctxUp,
        )
    }
    static concat(...dists: Dist<string>[]) {
        return Dist.cross(dists).map(x => x.join(""))
    }
    static u<A>(as: A[]) {
        return Dist.f(seed =>
            as[Math.floor(seed*as.length)]
        )
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
            mean
            +Math.sqrt(-2*Math.log(hash(111, seed)))
            *Math.cos(2*Math.PI*hash(222, seed))
            *sd as Z
        )
    }
    static ll(peak: number, mean: number) {
        return Dist.f(seed =>
            LogLogistic.fromPeakMean(peak, mean)
                .icdf(seed)
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
    static f<A>(
        pick: (seed: number) => A,
        ctx?: Ctx,
        key?: string,
    ) {
        const d: Dist<A> = Dist.rawF(
            seed => pick(hash(d.key, seed)),
            ctx,
            key,
        )
        return d
    }
    static rawF<A>(
        pick: (seed: string, ctx: Ctx) => A,
        ctx = {
            destiny: new Map<string, Dist<unknown>>,
            corr: new Graph<number>,
        },
        key = Dist.getKey(),
    ) {
        return new Dist(
            pick,
            ctx,
            key,
            "OK",
        )
    }
    static yet<A>() {
        return Dist.f<A>(() => {
            throw new Error("can't pick from abstract dist")
        })
    }
    static keyStack: { key: string, cnt: number }[] = [{ key: "DISTY!", cnt: 0 }]
    static pushKey(key: string) {
        this.keyStack.push({ key, cnt: 0 })
    }
    static popKey() {
        this.keyStack.pop()
    }
    static getKey() {
        this.keyStack.at(-1)!.cnt++
        return hashStr(...this.keyStack)
    }
}
