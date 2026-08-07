import { assert, assertEquals, assertThrows, assertLess } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist, Z } from "../mod.ts"

Deno.test("co", () => {
    const a = Dist.n()
    const b = Dist.n().co(a, 0.9)
    const c = a.destine(0 as Z).cross(b)
    console.log(c.pick(Math.random()))
})

