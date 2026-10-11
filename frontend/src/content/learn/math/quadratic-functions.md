The graph of a quadratic function is a **parabola**. Most questions about quadratic functions come down to one idea: each way of writing the function reveals a different feature of the graph.

## Three forms, three features

| Form | Equation | Shows directly |
| --- | --- | --- |
| standard | $y = ax^2 + bx + c$ | $y$-intercept $(0, c)$ |
| vertex | $y = a(x - h)^2 + k$ | vertex $(h, k)$ |
| factored | $y = a(x - r)(x - s)$ | $x$-intercepts $(r, 0)$ and $(s, 0)$ |

:::tip Which form does the question want?
"Which form displays the minimum value as a constant?" → vertex form. "Which shows the $x$-intercepts?" → factored form. "Which shows the $y$-intercept?" → standard form.
:::

## Properties of parabolas

- If $a > 0$ the parabola opens **up** and the vertex is a **minimum**; if $a < 0$ it opens **down** and the vertex is a **maximum**.
- A larger $\lvert a \rvert$ makes the parabola narrower.
- The parabola is symmetric about the vertical line through the vertex, $x = h$.
- The vertex's $x$-coordinate is halfway between the two $x$-intercepts: $h = \dfrac{r + s}{2}$.

## Finding the vertex

From standard form:

$$h = -\frac{b}{2a}, \qquad k = f(h)$$

:::examples
✓ $f(x) = 2x^2 - 12x + 7$: $h = \tfrac{12}{4} = 3$, $k = f(3) = 18 - 36 + 7 = -11$. Vertex $(3, -11)$, a minimum since $a > 0$.
:::

## Completing the square

To convert standard form to vertex form:

$$x^2 + 6x + 2 = (x^2 + 6x + 9) - 9 + 2 = (x + 3)^2 - 7$$

Take half of the $x$-coefficient, square it, add and subtract it. (If $a \ne 1$, factor $a$ out of the $x$ terms first.) The same technique finds the center of a circle from its equation.

## Symmetry shortcuts

If a parabola passes through $(1, 6)$ and $(7, 6)$, which have the same $y$-value, the axis of symmetry is halfway between them: $x = 4$. This often gives the vertex's $x$-coordinate with no algebra.

## The discriminant and the graph

$b^2 - 4ac$ tells you how many times the parabola meets the $x$-axis: positive → twice, zero → once (vertex on the axis), negative → never. (Details in the Quadratic Equations lesson.)

The same idea finds where a **line touches a parabola** exactly once: set the two equations equal, move everything to one side to get $ax^2 + Bx + C = 0$, and set that equation's discriminant equal to zero.

## Quadratic models

In a model like $h(t) = -16t^2 + 64t + 5$ for a ball's height:

- $h(0) = 5$ is the starting height.
- The vertex gives the **maximum height** and **when** it happens: $t = -\tfrac{64}{2(-16)} = 2$ seconds, $h(2) = 69$ feet.
- The positive zero is when the ball hits the ground.

:::tip Desmos
Graph the function and click the vertex and intercepts. Desmos labels the maximum/minimum point automatically.
:::

:::check
What is the vertex of the graph of $y = -3(x + 2)^2 + 8$?
- [ ] $(2, 8)$
- [x] $(-2, 8)$
- [ ] $(-2, -8)$
- [ ] $(3, 8)$
> Vertex form $a(x - h)^2 + k$ with $x + 2 = x - (-2)$, so $h = -2$ and $k = 8$.
:::

:::check
The function $f(x) = x^2 - 10x + 21$ is rewritten in the form $f(x) = (x - h)^2 + k$. What is the value of $k$?
- [ ] $-21$
- [x] $-4$
- [ ] $4$
- [ ] $21$
> Complete the square: $x^2 - 10x + 25 - 25 + 21 = (x - 5)^2 - 4$. (Check: $f(5) = 25 - 50 + 21 = -4$.)
:::

:::check
A parabola has $x$-intercepts at $(-1, 0)$ and $(9, 0)$. What is the $x$-coordinate of its vertex?
- [ ] $3$
- [x] $4$
- [ ] $5$
- [ ] $8$
> The vertex lies halfway between the intercepts: $\tfrac{-1 + 9}{2} = 4$.
:::

## Summary

- Standard form → $y$-intercept; vertex form → vertex; factored form → $x$-intercepts.
- $a > 0$ opens up (minimum); $a < 0$ opens down (maximum).
- Vertex $x = -\tfrac{b}{2a}$, also the midpoint of the $x$-intercepts.
- Complete the square to reach vertex form.
