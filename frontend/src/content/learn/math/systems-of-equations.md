A system of equations is two (or more) equations that must be true at the same time. Systems of Linear Equations is its own SAT skill, and systems also appear in word problems and in nonlinear questions. The solution is the point where the graphs intersect.

## Method 1: substitution

Best when one equation already has a variable by itself.

$$y = 2x - 1, \quad 3x + y = 14 \;\Rightarrow\; 3x + (2x - 1) = 14 \;\Rightarrow\; x = 3, \; y = 5$$

## Method 2: elimination

Best when both equations are in standard form. Multiply one or both equations so a variable has opposite coefficients, then add.

:::examples
✓ $2x + 3y = 12$ and $5x - 3y = 9$. Add them: $7x = 21$, so $x = 3$; then $2(3) + 3y = 12$ gives $y = 2$.
✓ $3x + 2y = 7$ and $x + y = 3$. Multiply the second by 2: $2x + 2y = 6$. Subtract: $x = 1$, then $y = 2$.
:::

## Shortcut: answer the question asked

Many questions ask for an expression like $x + y$ or $x - y$ rather than each variable. Adding or subtracting the equations often gives it immediately.

:::examples
✓ If $4x + 3y = 25$ and $2x + y = 11$, what is $x + y$? Subtract: $(4x + 3y) - (2x + y) = 2x + 2y = 14$, so $x + y = 7$.
:::

## No solution and infinitely many solutions

For two linear equations, compare slopes and intercepts:

| Lines | Solutions | Algebra test (for $ax + by = c$ and $dx + ey = f$) |
| --- | --- | --- |
| intersect once | one | different slopes |
| parallel | **none** | $\tfrac{a}{d} = \tfrac{b}{e} \ne \tfrac{c}{f}$ |
| same line | **infinitely many** | $\tfrac{a}{d} = \tfrac{b}{e} = \tfrac{c}{f}$ |

:::steps
For "no solution" questions with an unknown constant:
1. Put both equations in the same form.
2. Make the $x$ and $y$ coefficients proportional (same slope).
3. Check that the constants are **not** in the same proportion.
:::

:::examples
✓ For what $k$ does $3x - 2y = 5$ and $kx - 4y = 9$ have no solution? The $y$-coefficients have ratio $2$ ($-4 \div -2$), so $k = 6$; and $9 \ne 2 \times 5$ ✓.
:::

## Word problems

Two unknown quantities and two facts → two equations. Typical setups: total items and total cost, ($a + c = 200$, $8a + 5c = 1{,}300$); mixtures; two rates.

## Nonlinear systems

A line and a parabola (or circle) can meet 0, 1, or 2 times. Substitute the linear equation into the other to get a single quadratic, then solve or use the discriminant to count solutions.

:::examples
✓ For what $k$ does the line $y = 2x + k$ meet the parabola $y = x^2$ exactly once? Set $x^2 = 2x + k$, i.e., $x^2 - 2x - k = 0$. One solution means discriminant $4 + 4k = 0$, so $k = -1$ (the line is tangent).
:::

:::tip Desmos is the fastest method
Type both equations exactly as given (Desmos accepts standard form like `3x-2y=5`) and click the intersection point. Parallel lines show no intersection; identical lines overlap completely.
:::

:::check
If $x + 2y = 11$ and $3x - 2y = 1$, what is the value of $x$?
- [ ] $2$
- [x] $3$
- [ ] $4$
- [ ] $6$
> Add the equations: $4x = 12$, so $x = 3$.
:::

:::check
The system $6x + ay = 10$ and $3x + 2y = 4$ has no solution, where $a$ is a constant. What is the value of $a$?
- [ ] $2$
- [x] $4$
- [ ] $5$
- [ ] $8$
> The $x$-coefficients have ratio 2, so the $y$-coefficients must too: $a = 4$. The constants $10$ and $2 \times 4 = 8$ differ, so the lines are parallel.
:::

:::check
A store sells notebooks for \$3 and binders for \$5. Maya buys 12 items for \$46. How many binders does she buy?
- [ ] 4
- [x] 5
- [ ] 7
- [ ] 8
> $n + b = 12$ and $3n + 5b = 46$. Substitute $n = 12 - b$: $36 - 3b + 5b = 46$, so $b = 5$.
:::

## Summary

- Substitution when a variable is isolated; elimination for standard form.
- Look for a quick combination when the question asks for $x + y$ or similar.
- No solution: same slope, different intercept. Infinitely many: the same line.
- Desmos: graph both and click the intersection.
