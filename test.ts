import { Dist } from "./mod.ts"

const gender = Dist.u(["m", "f"] as const)

const name = gender
    .flatMatch("m", Dist.u(["John", "James"]))
    .flatMatch("f", Dist.u(["Jane", "Joy"]))

const age = Dist.range(10, 60)

const person = Dist.cross({
    type: "human",
    name,
    age,
})

console.log(person.pick())
