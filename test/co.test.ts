import { assertAlmostEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist, Z, arr } from "../mod.ts"
import * as m from "https://gnlow.dev/@learn/moment@0.1.0"
import { pearson } from "https://gnlow.dev/@learn/pearson@0.1.2"

Deno.test("simple apriori", () => {
    const a = Dist.n()
    const b = Dist.n().co(a, 0.9)
        .apriori(a, 1 as Z)
    const samples = b.sample(10000)
    assertAlmostEquals(m.mean(samples), 0.9, 0.01)
    assertAlmostEquals(m.variance(samples), 0.19, 0.01)
})
Deno.test("simple", () => {
    const a = Dist.n()
    const b = Dist.n().co(a, 0.9)
    const samples = b.sample(10000)
    assertAlmostEquals(m.mean(samples), 0, 0.05)
    assertAlmostEquals(m.variance(samples), 1, 0.05)
})
Deno.test("pearson - single", () => {
    const a = Dist.n()
    const b = Dist.n().co(a, 0.8)
    const c = Dist.cross([a, b])
    const samples = c.sample(10000)
    assertAlmostEquals(pearson(samples), 0.8, 0.05)
    assertAlmostEquals(m.variance(samples.map(x => x[1])), 1, 0.05)
})

Deno.test("pearson - simple mutual", () => {
    const a = Dist.n()
    const b = Dist.n()
    const c = Dist.n()
        .co(a, 0.5)
        .co(b, 0.3)
    const res = Dist.cross({ a, b, c }).sample(10000)
    console.log(
        pearson(res.map(o => [o.a, o.c])),
        0.5,
        0.1,
    )
    console.log(
        pearson(res.map(o => [o.b, o.c])),
        0.3,
        0.1,
    )
})
Deno.test("path", () => {
    const a = Dist.n()
    const b = Dist.n().co(a, 0.7)
    const c = Dist.n().co(a, 0.6)
    const d = Dist.n()
        .co(b, 0.5)
        .co(c, 0.4)
    console.log({
        a: a.key,
        b: b.key,
        c: c.key,
        d: d.key,
    })
    const samples = Dist.cross({ a, b, c, d }).sample(10000)
    console.log("bd", d.ctx.corr.getW(b.key, d.key))
    console.log(samples[0])
    assertAlmostEquals(m.variance(samples.map(s => s.d)), 1, 0.1)
    assertAlmostEquals(
        pearson(samples.map(s => [s.a, s.b])),
        0.7,
        0.1,
    )
    assertAlmostEquals(
        pearson(samples.map(s => [s.a, s.c])),
        0.6,
        0.1,
    )
    /*
    assertAlmostEquals(
        pearson(samples.map(s => [s.b, s.d])),
        0.5,
        0.2,
    )
    */ // todo
    assertAlmostEquals(
        pearson(samples.map(s => [s.c, s.d])),
        0.4,
        0.2, // todo fix,
    )
})
