A transformation moves or reshapes a graph. The SAT focuses on **translations** (shifts), which you can read straight from the function notation once you know which direction each change goes.

## Vertical shifts: outside the function

Adding a constant **outside** the function shifts the graph up or down, in the direction you'd expect.

- $y = f(x) + 3$: shift **up** 3.
- $y = f(x) - 3$: shift **down** 3.

## Horizontal shifts: inside the function

Adding a constant **inside**, to the input, shifts the graph left or right, in the **opposite** direction from the sign.

:::rule Horizontal shifts are backwards
- $y = f(x - 3)$: shift **right** 3.
- $y = f(x + 3)$: shift **left** 3.
:::

Why? In $f(x - 3)$, the graph reaches the value $f(0)$ when $x - 3 = 0$, that is, at $x = 3$: three units to the right.

:::tip The "set it to zero" trick
To find a horizontal shift, set the expression inside the parentheses equal to zero and solve. $f(x + 6)$: $x + 6 = 0 \Rightarrow x = -6$, so 6 units **left**. $f(x - 1)$: $x = 1$, so 1 unit **right**. The sign of the answer is the direction.
:::

The order of a horizontal and a vertical shift doesn't matter. To shift $f(x) = (x - 1)^2 + 4$ left 3 and down 2, substitute $x + 3$ for $x$ and subtract 2: $g(x) = (x + 2)^2 + 2$.

:::examples
✓ $y = (x - 2)^2 + 5$ is the parabola $y = x^2$ shifted right 2 and up 5, so its vertex is $(2, 5)$.
✓ If $f(x) = \sqrt{x}$, then $g(x) = \sqrt{x + 4} - 1$ is $f$ shifted left 4 and down 1.
:::

## Reflections and stretches (less common)

- $y = -f(x)$: reflect over the $x$-axis (flip upside down).
- $y = f(-x)$: reflect over the $y$-axis.
- $y = 2f(x)$: stretch vertically by a factor of 2.

## Points move with the graph

If $(a, b)$ is on the graph of $f$, then:

| New function | Point moves to |
| --- | --- |
| $f(x) + k$ | $(a, \; b + k)$ |
| $f(x - h)$ | $(a + h, \; b)$ |
| $f(x - h) + k$ | $(a + h, \; b + k)$ |
| $-f(x)$ | $(a, \; -b)$ |

So a zero of $f$ at $x = 1$ becomes a zero of $f(x - 4)$ at $x = 5$.

:::trap Shifting a table of values
If a question gives a table for $f$ and asks about $f(x + 2)$, then $f(x + 2)$ at $x = 1$ uses the table's value at $x = 3$. Plug in carefully rather than shifting in your head.
:::

:::tip Desmos
Define `f(x)=...` and then type `g(x)=f(x-3)+2`. Desmos graphs both, so you can see the shift and click points to confirm coordinates.
:::

:::check
The graph of $y = f(x)$ is shifted 4 units left and 2 units down. Which equation represents the new graph?
- [ ] $y = f(x - 4) - 2$
- [x] $y = f(x + 4) - 2$
- [ ] $y = f(x + 4) + 2$
- [ ] $y = f(x - 2) + 4$
> Left 4 means $x + 4$ inside; down 2 means $-2$ outside.
:::

:::check
The point $(3, 7)$ lies on the graph of $y = g(x)$. Which point must lie on the graph of $y = g(x - 5) + 1$?
- [ ] $(-2, 8)$
- [ ] $(8, 6)$
- [x] $(8, 8)$
- [ ] $(3, 13)$
> $x - 5$ shifts right 5 ($3 \to 8$); $+1$ shifts up 1 ($7 \to 8$).
:::

## Summary

- Outside changes ($+k$) move the graph up/down in the expected direction.
- Inside changes ($x - h$) move it left/right in the opposite direction: $x - 3$ is right 3.
- Points move with the graph: $(a, b) \to (a + h, b + k)$ for $f(x - h) + k$.
