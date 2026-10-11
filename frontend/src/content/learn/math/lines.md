Lines are the most tested topic in SAT Math. Linear Functions and Linear Equations in Two Variables together make up a large share of the Algebra domain. Everything comes back to two numbers: the **slope** and the **$y$-intercept**.

## Slope

Slope measures how steep a line is: the change in $y$ for every 1-unit change in $x$.

$$m = \frac{y_2 - y_1}{x_2 - x_1} = \frac{\text{rise}}{\text{run}}$$

- Positive slope: the line rises left to right. Negative: it falls.
- Slope 0: horizontal line. Undefined slope: vertical line.

:::trap Keep the order consistent
If you start the numerator with point 2, start the denominator with point 2 as well. Mixing the order flips the sign.
:::

## Intercepts

- **$y$-intercept**: where the line crosses the $y$-axis; set $x = 0$.
- **$x$-intercept**: where it crosses the $x$-axis; set $y = 0$.

For $3x + 4y = 24$: $x$-intercept $(8, 0)$, $y$-intercept $(0, 6)$. In general, $Ax + By = C$ has $x$-intercept $\left(\tfrac{C}{A}, 0\right)$ and $y$-intercept $\left(0, \tfrac{C}{B}\right)$.

## Three forms of a line

| Form | Equation | What it shows directly |
| --- | --- | --- |
| slope-intercept | $y = mx + b$ | slope $m$, $y$-intercept $(0, b)$ |
| point-slope | $y - y_1 = m(x - x_1)$ | slope and one point $(x_1, y_1)$ |
| standard | $Ax + By = C$ | both intercepts easily; slope is $-\tfrac{A}{B}$ |

:::steps
To write the equation of a line from two points:
1. Find the slope from the two points.
2. Plug the slope and one point into point-slope form (or into $y = mx + b$ and solve for $b$).
3. Rearrange into the form the answer choices use.
:::

:::examples
✓ Through $(2, 1)$ and $(6, 9)$: $m = \tfrac{9 - 1}{6 - 2} = 2$. Then $1 = 2(2) + b$, so $b = -3$: $y = 2x - 3$.
:::

## Parallel and perpendicular lines

:::rule Slopes of related lines
- **Parallel** lines have **equal** slopes (and different intercepts).
- **Perpendicular** lines have slopes that are **negative reciprocals**: if one slope is $m$, the other is $-\tfrac{1}{m}$. Their product is $-1$.
:::

A line perpendicular to $y = \tfrac{2}{3}x + 5$ has slope $-\tfrac{3}{2}$.

When two lines are written in standard form, convert to slope-intercept form (or use $-\tfrac{A}{B}$) before comparing slopes.

## Horizontal and vertical lines

- $y = 4$ is horizontal: every point has $y$-coordinate 4. Slope 0.
- $x = -2$ is vertical: every point has $x$-coordinate $-2$. Undefined slope.

## Linear functions from tables

In a table where $x$ goes up by equal steps, a linear function's outputs change by equal amounts. The slope is the change in $f(x)$ divided by the change in $x$; then use any row to find the intercept.

:::tip Desmos regression
With a table of points, open a Desmos table, enter the values as $x_1$ and $y_1$, and type `y1 ~ m x1 + b`. Desmos reports $m$ and $b$ exactly when the data are linear.
:::

:::check
What is the slope of the line that passes through $(-1, 4)$ and $(3, -8)$?
- [x] $-3$
- [ ] $-\tfrac{1}{3}$
- [ ] $\tfrac{1}{3}$
- [ ] $3$
> $m = \tfrac{-8 - 4}{3 - (-1)} = \tfrac{-12}{4} = -3$.
:::

:::check
Line $k$ is perpendicular to the line $2x - 5y = 10$. What is the slope of line $k$?
- [x] $-\tfrac{5}{2}$
- [ ] $-\tfrac{2}{5}$
- [ ] $\tfrac{2}{5}$
- [ ] $\tfrac{5}{2}$
> Solve for $y$: $y = \tfrac{2}{5}x - 2$, so the slope is $\tfrac{2}{5}$. The perpendicular slope is the negative reciprocal, $-\tfrac{5}{2}$.
:::

:::check
The line $y = mx + 7$ passes through the point $(4, -1)$. What is the value of $m$?
- [x] $-2$
- [ ] $-\tfrac{1}{2}$
- [ ] $\tfrac{3}{2}$
- [ ] $2$
> Substitute: $-1 = 4m + 7$, so $4m = -8$ and $m = -2$.
:::

## Summary

- Slope = rise over run, with a consistent order of points.
- $y = mx + b$ shows slope and $y$-intercept; set $x = 0$ or $y = 0$ for intercepts.
- Parallel: equal slopes. Perpendicular: negative reciprocal slopes.
- A point on the line satisfies its equation: plug it in to find unknown constants.
