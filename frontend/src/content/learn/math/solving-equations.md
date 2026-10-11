Solving equations is the skill underneath almost every Algebra question. The SAT rarely gives you a plain "solve $2x + 3 = 11$"; instead it hides the equation in a formula, asks for an expression instead of $x$, or adds a fraction or root that can produce fake solutions. This lesson builds a reliable process.

## The golden rule

Whatever you do to one side, do to the **entire** other side. Undo operations in reverse order: first clear addition/subtraction around the variable term, then multiplication/division, then powers and roots.

:::examples
✓ $\dfrac{3x - 4}{5} = 7$ → $3x - 4 = 35$ → $3x = 39$ → $x = 13$ // multiply both sides by 5 first.
✗ $\dfrac{3x - 4}{5} = 7$ → $3x - \dfrac{4}{5} = 7$ // divided only part of the left side.
:::

:::trap Common mistakes
- Multiplying only one term on a side: $\dfrac{x}{2} + 3 = 5$ times 2 is $x + 6 = 10$, not $x + 3 = 10$.
- Losing a negative sign when moving a term.
- Squaring term by term. Squaring $\sqrt{x} + 3 = 7$ does not give $x + 9 = 49$. Isolate the root first ($\sqrt{x} = 4$), then square: $x = 16$.
- Forgetting that $\sqrt{25}$ means only the positive root, $5$. The $\pm$ appears only when **you** take a square root to solve $x^2 = 25$.
- Dividing by a variable that could be zero, which can throw away a solution. Move everything to one side and factor instead: $x^2 = 5x$ → $x(x - 5) = 0$ → $x = 0$ or $x = 5$.
:::

## Isolating a variable in a formula

"Which equation correctly expresses $r$ in terms of $V$ and $h$?" Treat every other letter as if it were a number and solve as usual.

$$V = \pi r^2 h \;\Rightarrow\; r^2 = \frac{V}{\pi h} \;\Rightarrow\; r = \sqrt{\frac{V}{\pi h}}$$

If the variable appears in more than one term, collect those terms on one side and **factor it out**:

$$ax + b = cx \;\Rightarrow\; ax - cx = -b \;\Rightarrow\; x(a - c) = -b \;\Rightarrow\; x = \frac{-b}{a - c}$$

## Solve for the expression, not the variable

When a question asks for the value of something like $4x - 6$, look for a way to get it directly from the given equation, often by multiplying or dividing the whole equation.

:::examples
✓ If $2x - 3 = 9$, then $4x - 6 = 2(2x - 3) = 18$. // no need to find $x$ first.
✓ If $\dfrac{3a}{b} = 4$, then flipping both sides gives $\dfrac{b}{3a} = \dfrac{1}{4}$, so $\dfrac{b}{a} = \dfrac{3}{4}$. // reciprocals answer "what is b/a?"
:::

## Fractions and cross-multiplying

To clear fractions, multiply every term by the least common denominator. For a single fraction equal to a single fraction, cross-multiply:

$$\frac{x + 1}{4} = \frac{x - 2}{3} \;\Rightarrow\; 3(x + 1) = 4(x - 2) \;\Rightarrow\; x = 11$$

## Extraneous solutions

Squaring both sides (to remove a square root) or multiplying by an expression with a variable (to clear a denominator) can create answers that **don't work** in the original equation. Always plug your answers back in.

:::examples
✓ $\sqrt{x + 6} = x$ → $x + 6 = x^2$ → $x^2 - x - 6 = 0$ → $x = 3$ or $x = -2$. Check: $\sqrt{9} = 3$ ✓, but $\sqrt{4} = 2 \ne -2$ ✗. Only $x = 3$ works. // a square root can't equal a negative number.
:::

Similarly, a value that makes any denominator in the original equation zero is never a valid solution.

:::tip Let Desmos solve it
For an equation with one variable, graph the left side and the right side as two functions and read the $x$-coordinates of the intersection points. Extraneous solutions don't appear as intersections, so the graph checks your algebra too.
:::

:::check
If $\dfrac{2x + 5}{3} = x - 1$, what is the value of $x$?
- [ ] $2$
- [ ] $4$
- [ ] $6$
- [x] $8$
> Multiply both sides by 3: $2x + 5 = 3x - 3$, so $x = 8$. Check: $\tfrac{21}{3} = 7 = 8 - 1$ ✓.
:::

:::check
The formula $A = \tfrac{1}{2}h(b_1 + b_2)$ gives the area of a trapezoid. Which equation gives $b_1$ in terms of $A$, $h$, and $b_2$?
- [ ] $b_1 = 2Ah - b_2$
- [x] $b_1 = \dfrac{2A}{h} - b_2$
- [ ] $b_1 = \dfrac{A}{2h} - b_2$
- [ ] $b_1 = \dfrac{2A - b_2}{h}$
> Multiply by 2: $2A = h(b_1 + b_2)$. Divide by $h$: $\tfrac{2A}{h} = b_1 + b_2$. Subtract $b_2$.
:::

:::check
If $3a + 6b = 21$, what is the value of $a + 2b$?
- [ ] $3$
- [x] $7$
- [ ] $14$
- [ ] It cannot be determined.
> Divide the whole equation by 3: $a + 2b = 7$. You don't need $a$ and $b$ separately.
:::

## Summary

- Do the same thing to every term on both sides; undo operations in reverse order.
- To isolate a variable that appears twice, collect and factor it out.
- Look for a direct route to the expression the question asks for.
- Check answers after squaring or clearing variable denominators: some may be extraneous.
