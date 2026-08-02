import { assert, assertEquals, assertThrows } from "https://esm.sh/jsr/@std/assert@1.0.19"
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

Deno.test("destine", () => {
    const id = Dist.f(seed => seed)
    const double = id.map(x => x*2)
    
    id.destine(123)
    assert(double.pick(Math.random()) != 246)
    
    const iwd = Dist.cross([id.destine(123), double])
    console.log(iwd.destiny, iwd.pick(Math.random()))
    assertEquals(iwd.pick(Math.random())[1], 246)
    
    assertThrows(() => double.destine(2345))
})

Deno.test("flatMap", () => {
    const gender = Dist.u(["m", "f"] as const)
    const name = gender
        .flatMap(g => g == "m"
            ? Dist.u([
                "Mike", "Matt", "Michel", "Marcus", "Mason",
                "Matthew", "Miles", "Maxwell", "Milo", "Maverick",
            ]).withKey("names")
            : Dist.u([
                  "Fiona", "Fay", "Frances", "Flora", "Faith",
                  "Freya", "Felicia", "Farrah", "Francesca", "Fatima",
            ]).withKey("names")
        )
    
    assertEquals(name.pick(0.123), name.pick(0.123))
})
