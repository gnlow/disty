import { Dist, arr } from "./mod.ts"

const gender = Dist.u(["m", "f"] as const)

const mName = Dist.u(["John", "James"])
const fName = Dist.u(["Jane", "Joy"])
const name = gender
    .flatMatch("m", mName)
    .flatMatch("f", fName)

const age = Dist.range(10, 60)

const person = Dist.cross({
    type: "human",
    gender,
    name,
    age,
})

console.log(arr(10).map(i => [
    person.pick(i),
]))

Dist.u([1]).cross(Dist.u([2])) satisfies Dist<[number, number]>
Dist.cross([Dist.u([1]), Dist.u([2])]) satisfies Dist<[number, number]>
