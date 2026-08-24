import { assertEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist } from "../mod.ts"

Deno.test("c", () => {
    const human = Dist.cross({
        name: Dist.u(["James"]),
    })
    class Human extends human.c() {
        greet() {
            return `Hello, my name is ${this.name}`
        }
    }
    const human1 = new Human("hi")
    assertEquals(
        human1.greet(),
        "Hello, my name is James",
    )
})
