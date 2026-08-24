import { assertAlmostEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"
import { Dist } from "../mod.ts"

Deno.test("c", () => {
    const human = Dist.cross({
        name_: Dist.u(["James"]),
    })
    class Human extends human.c() {
        greet() {
            console.log(`Hello, my name is ${this.name_}`)
        }
    }
    const human1 = new Human("hi")
    human1.greet()
})
