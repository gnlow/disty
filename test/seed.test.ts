import { assert, assertEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist } from "../mod.ts"

Deno.test("basic", () => {
    const id = Dist.f(seed => seed)
    const id2 = id.map(x => x)
    const notId = id.withKey()
    
    const double = Dist.cross([id, id2])
        .map(([a, b]) => a+b)
    const double2 = id.map(x => x*2)
    const notDouble = double.withKey()
    
    assert(id.pick(123) < 1)
    assertEquals(id.pick(123), id2.pick(123))
    assert(id.pick(123) != notId.pick(123))
    
    assertEquals(double.pick(456), double2.pick(456))
    assert(double.pick(456) != notDouble.pick(456))
    assertEquals(notDouble.pick(567), notDouble.pick(567))
})
