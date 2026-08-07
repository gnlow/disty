import { assertAlmostEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist, Z, arr } from "../mod.ts"
import * as m from "https://gnlow.dev/@learn/moment@0.1.0"

Deno.test("simple", () => {
    const a = Dist.n().withKey("a")
    const b = Dist.n().withKey("c").co(a, 0.9)
        .apriori(a, 1 as Z)
    const samples = arr(10000).map(() => b.pick(Math.random()))
    assertAlmostEquals(m.mean(samples), 0.9, 0.01)
    assertAlmostEquals(m.variance(samples), 0.19, 0.01)
})
