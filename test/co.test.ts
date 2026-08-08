import { assertAlmostEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist, Z, arr } from "../mod.ts"
import * as m from "https://gnlow.dev/@learn/moment@0.1.0"
import { pearson } from "https://gnlow.dev/@learn/pearson@0.1.2"

Deno.test("simple apriori", () => {
    const a = Dist.n()
    const b = Dist.n().co(a, 0.9)
        .apriori(a, 1 as Z)
    const samples = arr(10000).map(() => b.pick(Math.random()+""))
    assertAlmostEquals(m.mean(samples), 0.9, 0.01)
    assertAlmostEquals(m.variance(samples), 0.19, 0.01)
})
Deno.test("simple", () => {
    const a = Dist.n()
    const b = Dist.n().co(a, 0.9)
    const samples = arr(10000).map(() => b.pick(Math.random()+""))
    assertAlmostEquals(m.mean(samples), 0, 0.1)
    assertAlmostEquals(m.variance(samples), 1, 0.1)
})
Deno.test("pearson", () => {
    const a = Dist.n()
    const b = Dist.n().co(a, 0.8)
    const c = Dist.cross([a, b])
    const samples = arr(10000).map(() => c.pick(Math.random()+""))
    assertAlmostEquals(pearson(samples), 0.8, 0.01)
})
