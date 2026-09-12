import { Danjo } from "https://gnlow.dev/danjo@0.2.0"

export function memoize() {
    return (
        target: (i: number) => any,
        context: ClassMethodDecoratorContext,
    ) => {
        const instanceCaches = new WeakMap<object, Map<number, any>>()

        return function (this: object, i: number) {
            return instanceCaches
                .getOrInsert(this, new Map())
                .getOrInsertComputed(i, key => target.call(this, key))
        }
    }
}

export class Poisson {
    constructor(public lambda: number) {}
    static from(lambda: number) {
        return new Poisson(lambda)
    }
    
    @memoize()
    pmf(i: number): number {
        return i == 0
            ? Math.exp(-this.lambda)
            : this.pmf(i-1)*(this.lambda/i)
    }
    @memoize()
    cdf(i: number): number {
        if (i == Infinity) return 1
        return i < 0
            ? 0
            : this.cdf(i-1)+this.pmf(i)
    }
    icdf(p: number) {
        return Math.round(
            Danjo.f(i => this.cdf(Math.floor(i))!)
                .restrict(0, 10+this.lambda+8*Math.sqrt(this.lambda))
                .bisect(p, { xPrec: 0.4, maxTrial: 20 })
        )
    }
}
