import { assert, assertEquals, assertThrows, assertLess, assertNotEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist } from "../mod.ts"

Deno.test("basic", () => {
    const id = Dist.f(seed => seed)
    const id2 = id.map(x => x)
    const notId = id.branch()
    console.log("key", id.key, notId.key)
    
    const double = Dist.cross([id, id2])
        .map(([a, b]) => a+b)
    const double2 = id.map(x => x*2)
    const notDouble = double.branch()
    
    assert(id.pick("123") < 1)
    assertEquals(id.pick("123"), id2.pick("123"))
    assertNotEquals(id.pick("123"), notId.pick("123"))
    
    assertEquals(double.pick("456"), double2.pick("456"))
    assertNotEquals(double.pick("456"), notDouble.pick("456"))
    assertEquals(notDouble.pick("567"), notDouble.pick("567"))
})

Deno.test("destine", () => {
    const id = Dist.f(seed => seed)
    const double = id.map(x => x*2)
    
    id.destine(123)
    assert(double.pick(Math.random()+"") != 246)
    
    const iwd = Dist.cross([id.destine(123), double])
    console.log(iwd.ctx.destiny, iwd.pick(Math.random()+""))
    assertEquals(iwd.pick(Math.random()+"")[1], 246)
    
    assertThrows(() => double.destine(2345))
})

Deno.test("flatMap", () => {
    const gender = Dist.u(["m", "f"] as const)
    const name = gender
        .flatMap(g => g == "m"
            ? Dist.u([
                "Mike", "Matt", "Michel", "Marcus", "Mason",
                "Matthew", "Miles", "Maxwell", "Milo", "Maverick",
            ])
            : Dist.u([
                  "Fiona", "Fay", "Frances", "Flora", "Faith",
                  "Freya", "Felicia", "Farrah", "Francesca", "Fatima",
            ])
        )
    
    assertEquals(name.pick("123"), name.pick("123"))
})

Deno.test("morph", () => {
    const r1 = Dist.range(0, 100)
    const r2 = r1.morph(Dist.range(-100, 0))
    const r1double = r1.map(x => x*2)
    const c = Dist.cross([r2, r1double])
    assertLess(c.pick(Math.random()+"")[1], 0)
    
    const age = Dist.yet<number>()
    const birth = age.map(x => 2027-x)
    const vv = Dist.cross({ age: age, birth })
        .map(x => x.birth)
        .apriori(age, 25)
    assertEquals(vv.pick(Math.random()+""), 2002)
})
