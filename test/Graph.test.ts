import { Graph } from "../src/Graph.ts"
import { assertEquals } from "https://esm.sh/jsr/@std/assert@1.0.19"

Deno.test("dfsW", () => {
    const g = new Graph()
        .add("a", "b", 0.7)
        .add("a", "c", 0.6)
        .add("b", "d", 0.5)
        .add("c", "d", 0.4)
    assertEquals(
        g.dfsW("a", "d"),
        [[0.7, 0.5], [0.6, 0.4]],
    )
})
