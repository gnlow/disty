import { Dist, Z, arr } from "../mod.ts"

const d = Dist.rawF(x => {
    console.log(x)
    return x
})
console.log(d.filter(x => x.startsWith("0")).pick("hi"))
