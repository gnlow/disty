import { assertAlmostEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist, Z, arr } from "../mod.ts"
import * as m from "https://gnlow.dev/@learn/moment@0.1.0"

Deno.test("simple apriori", () => {
    const a = Dist.n().withKey("a")
    const b = Dist.n().withKey("b").co(a, 0.9)
        .apriori(a, 1 as Z)
    const samples = arr(10000).map(() => b.pick(Math.random()))
    assertAlmostEquals(m.mean(samples), 0.9, 0.01)
    assertAlmostEquals(m.variance(samples), 0.19, 0.01)
})
Deno.test("simple", () => {
    const a = Dist.n().withKey("a")
    const b = Dist.n().withKey("b").co(a, 0.9)
    const samples = arr(10000).map(() => b.pick(Math.random()))
    assertAlmostEquals(m.mean(samples), 0, 0.1)
    assertAlmostEquals(m.variance(samples), 1, 0.1)
})
Deno.test("add", () => {
    const a = Dist.n().map(x => {
        console.log("a", x)
        return x
    }).withKey("a")
    const b = Dist.n().map(x => {
        console.log("b", x)
        return x
    }).withKey("b").co(a, 1)
    //const c = Dist.cross([a, b]).map(([a, b]) => a+b)
    //const samples = arr(10).map(() => c.pick(Math.random()))
    console.log(a.cross(b).pick(0.1234))

})
