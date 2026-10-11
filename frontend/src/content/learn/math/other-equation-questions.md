Some equation questions don't ask you to find $x$ at all. They ask what a constant must be for the equation to be true for **all** $x$, for **no** $x$, or how many solutions an equation has. These are some of the most predictable questions on the test once you know the patterns.

## Matching terms (identities)

If an equation is true **for all values of $x$**, the two sides are the same expression. So the coefficients of matching terms must be equal.

:::examples
✓ If $(ax + 3)(2x - 1) = 6x^2 + bx - 3$ for all $x$: expanding the left gives $2ax^2 + (6 - a)x - 3$. Match $x^2$ terms: $2a = 6$, so $a = 3$. Match $x$ terms: $b = 6 - a = 3$. // set coefficient equal to coefficient.
:::

:::steps
1. Expand or simplify both sides fully.
2. Line up the terms by power of $x$ ($x^2$, $x$, constant).
3. Set the coefficients of each power equal and solve.
:::

## Linear equations: one, none, or infinitely many solutions

Simplify both sides to the form $ax + b = cx + d$.

| Situation | Number of solutions | Example |
| --- | --- | --- |
| different $x$-coefficients ($a \ne c$) | exactly one | $3x + 1 = x + 5$ |
| same $x$-coefficients, different constants | **no** solution | $3x + 1 = 3x + 5$ (gives $1 = 5$) |
| same $x$-coefficients, same constants | **infinitely many** | $3x + 1 = 3x + 1$ (gives $0 = 0$) |

:::tip The quick test
For "no solution," the variable terms must cancel and leave a false statement. For "infinitely many," everything must cancel. So set the $x$-coefficients equal first, then compare constants.
:::

:::examples
✓ For what value of $k$ does $4(x - 2) = kx + 3$ have no solution? Left side: $4x - 8$. Need $k = 4$ (same slope) and $-8 \ne 3$ ✓. So $k = 4$.
:::

## Absolute value

$\lvert x \rvert$ is the distance from $x$ to $0$, so it's never negative. An equation $\lvert \text{expression} \rvert = c$ splits into two cases:

$$\lvert x - 4 \rvert = 7 \;\Rightarrow\; x - 4 = 7 \;\text{ or }\; x - 4 = -7 \;\Rightarrow\; x = 11 \text{ or } x = -3$$

- If $c > 0$: two solutions.
- If $c = 0$: one solution.
- If $c < 0$: no solution, since an absolute value can't be negative.

Isolate the absolute value **before** splitting: $2\lvert x + 1 \rvert - 3 = 9$ becomes $\lvert x + 1 \rvert = 6$ first.

If the right side contains the variable, as in $\lvert x - 3 \rvert = 2x$, solve both cases and **check each answer**: a case can produce a value that makes the right side negative, which an absolute value can never equal.

## How many solutions? Think graphically

For more complicated equations, the number of solutions equals the number of times the graphs of the two sides intersect.

- A line and a parabola: 0, 1, or 2 intersections.
- A quadratic equation $ax^2 + bx + c = 0$: use the discriminant (see the Quadratic Functions lesson) or graph it.
- An equation like $x^2 = -4$ (or $(2x - 1)^2 = -9$) has no real solution, because a square is never negative.
- A product of factors equal to zero, like $(x - 2)(x + 5)(x - 2) = 0$, has as many **distinct** solutions as distinct factors: here two ($2$ and $-5$).

:::tip Desmos
Type each side as its own function and count the intersection points. For equations with a parameter, Desmos lets you add a slider for the constant and watch how the number of intersections changes.
:::

:::check
In the equation $5(x + 2) - 2x = ax + 10$, $a$ is a constant. If the equation has infinitely many solutions, what is the value of $a$?
- [ ] $2$
- [x] $3$
- [ ] $5$
- [ ] $10$
> The left side simplifies to $3x + 10$. For infinitely many solutions both sides must be identical, so $a = 3$ (and the constants already match: $10 = 10$).
:::

:::check
How many solutions does $\lvert 2x - 6 \rvert + 5 = 1$ have?
- [x] zero
- [ ] exactly one
- [ ] exactly two
- [ ] infinitely many
> Isolate the absolute value: $\lvert 2x - 6 \rvert = -4$. An absolute value can never be negative, so there's no solution.
:::

:::check
If $(x + 5)(x + k) = x^2 + 2x - 15$ for all values of $x$, what is the value of $k$?
- [ ] $-5$
- [x] $-3$
- [ ] $3$
- [ ] $5$
> Expand: $x^2 + (5 + k)x + 5k$. Match the constant: $5k = -15$, so $k = -3$. Check the $x$ term: $5 + (-3) = 2$ ✓.
:::

## Summary

- "True for all $x$" → expand and match coefficients.
- Linear equations: different slopes → one solution; same slope, different constants → none; identical → infinitely many.
- Absolute value: isolate it, then split into two cases; a negative right side means no solution.
- Count solutions by counting intersections of the two sides' graphs.
