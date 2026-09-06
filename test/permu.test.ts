import { Dist } from "../mod.ts"

const dist = Dist.permu(["a", "b", "c"], 3)

console.log(dist.pick("hello"))
