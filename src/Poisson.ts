export function memoize() {
    return (
        target: (i: number) => any,
        context: ClassMethodDecoratorContext,
    ) => {
        const instanceCaches = new WeakMap<object, Map<number, any>>()

        return function (i: number) {
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
    pmf(i: number) {
        return i == 0
            ? Math.exp(-this.lambda)
            : this.pmf(i-1)*(this.lambda/i)
    }
    @memoize()
    cdf(i: number) {
        return i < 0
            ? 0
            : this.cdf(i-1)+this.pmf(i)
    }
}
