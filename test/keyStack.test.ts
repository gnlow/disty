import { assertEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist } from "../mod.ts"

Deno.test("keyStack", () => {
    const d = Dist.f(s => s)
        .flatMap(s1 => Dist.f(s2 => JSON.stringify([s1, s2])))
    console.log(d.key)
    assertEquals(d.pick(0.123), d.pick(0.123))
})
