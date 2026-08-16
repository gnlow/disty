import { assertEquals, assertNotEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist } from "../mod.ts"

Deno.test("keyStack", () => {
    const d = Dist.f(s => s)
        .flatMap(s1 => Dist.f(s2 => JSON.stringify([s1, s2])))
    const d2 = Dist.f(s => s)
        .flatMap(s1 => Dist.f(s2 => JSON.stringify([s1, s2])))
    
    assertEquals(d.pick("123"), d.pick("123"))
    assertNotEquals(d.pick("123"), d2.pick("123"))
    assertNotEquals(
        Dist.f(s => s).pick("123"),
        Dist.f(s => s).pick("123"),
    )
})

Deno.test("pick with default seed", () => {
    const l = Dist.n().map(x => [x, Dist.n().pick()])
    assertEquals(l.pick("hello"), l.pick("hello"))
    assertNotEquals(Dist.n().pick(), Dist.n().pick())
})
