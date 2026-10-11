Quadratic equations, $ax^2 + bx + c = 0$, are the core of the Nonlinear Equations skill. There are three ways to solve them, plus a pair of shortcuts that answer some questions without solving at all.

## Method 1: factoring

Move everything to one side, factor, and set each factor equal to zero (the zero product property).

$$x^2 - 3x - 10 = 0 \;\Rightarrow\; (x - 5)(x + 2) = 0 \;\Rightarrow\; x = 5 \text{ or } x = -2$$

:::trap Set the equation equal to zero first
$x^2 - 3x = 10$ does **not** mean $x = 10$ or $x - 3 = 10$. Factoring only works when one side is 0.
:::

## Method 2: the quadratic formula

Works for every quadratic, even ones that don't factor nicely:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

:::examples
✓ $2x^2 + 3x - 4 = 0$: $a = 2$, $b = 3$, $c = -4$. $x = \dfrac{-3 \pm \sqrt{9 + 32}}{4} = \dfrac{-3 \pm \sqrt{41}}{4}$.
:::

Answer choices with a $\pm\sqrt{\;}$ are a strong hint that the quadratic formula (or completing the square) is the intended route.

## Method 3: square roots

If there's no $x$ term, isolate $x^2$ and take the square root, remembering **both** signs: $3x^2 = 48 \Rightarrow x^2 = 16 \Rightarrow x = \pm 4$. The same works for $(x - 2)^2 = 25 \Rightarrow x - 2 = \pm 5 \Rightarrow x = 7$ or $x = -3$.

## Substituting a repeated chunk

When the same expression appears more than once, replace it with a single letter. In $(x - 2)^2 - 3(x - 2) - 10 = 0$, let $A = x - 2$: $A^2 - 3A - 10 = 0$ gives $A = 5$ or $A = -2$, so $x = 7$ or $x = 0$.

## Sum and product of the solutions

For $ax^2 + bx + c = 0$ with solutions $r$ and $s$:

:::rule Sum and product
$$r + s = -\frac{b}{a} \qquad\qquad r \cdot s = \frac{c}{a}$$
:::

These answer "what is the sum of the solutions?" in one step, even when the solutions themselves are ugly. For $2x^2 - 10x + 3 = 0$, the sum is $\tfrac{10}{2} = 5$.

## The discriminant: how many solutions?

The expression under the root, $b^2 - 4ac$, tells you the number of **real** solutions:

| $b^2 - 4ac$ | Real solutions | Graph of $y = ax^2 + bx + c$ |
| --- | --- | --- |
| positive | two | crosses the $x$-axis twice |
| zero | exactly one | touches the $x$-axis at its vertex |
| negative | none | never touches the $x$-axis |

:::examples
✓ For what value of $k$ does $x^2 + 6x + k = 0$ have exactly one solution? Set $36 - 4k = 0$, so $k = 9$. // then it's $(x+3)^2 = 0$.
:::

## Where quadratics appear

- Equations that become quadratic after clearing a fraction or squaring a root (check for extraneous solutions).
- Systems of a line and a parabola: substitute to get one quadratic, then count or find intersections.
- Area problems: a rectangle whose length is 3 more than its width with area 40 gives $w(w + 3) = 40$.

:::tip Desmos
Graph $y = ax^2 + bx + c$ and click the $x$-intercepts to read the solutions. For "how many solutions" questions with a constant like $k$, add a slider and watch the parabola touch the axis.

Desmos also factors for you: an $x$-intercept at $c$ means $(x - c)$ is a factor, and an intercept at a fraction $\tfrac{p}{q}$ means $(qx - p)$ is a factor. If $y = 3x^2 - 4x - 4$ crosses at $x = 2$ and $x = -\tfrac{2}{3}$, it factors as $(x - 2)(3x + 2)$.
:::

:::check
What are the solutions to $x^2 + 4x = 21$?
- [ ] $x = 3$ and $x = 7$
- [x] $x = 3$ and $x = -7$
- [ ] $x = -3$ and $x = 7$
- [ ] $x = 21$ and $x = -4$
> Set equal to zero: $x^2 + 4x - 21 = 0 \Rightarrow (x + 7)(x - 3) = 0$.
:::

:::check
What is the sum of the solutions to $3x^2 - 12x + 2 = 0$?
- [ ] $-4$
- [ ] $\tfrac{2}{3}$
- [x] $4$
- [ ] $12$
> Sum $= -\tfrac{b}{a} = -\tfrac{-12}{3} = 4$.
:::

:::check
How many real solutions does $2x^2 - 3x + 5 = 0$ have?
- [x] zero
- [ ] exactly one
- [ ] exactly two
- [ ] infinitely many
> Discriminant: $(-3)^2 - 4(2)(5) = 9 - 40 = -31 < 0$, so there are no real solutions.
:::

## Summary

- Set the equation equal to zero, then factor, use the quadratic formula, or take square roots (±).
- Sum of solutions $= -b/a$; product $= c/a$.
- Discriminant $b^2 - 4ac$: positive → 2, zero → 1, negative → 0 real solutions.
