A function is a rule that turns each input into exactly one output. Function notation shows up across the Math section: in Linear Functions, Nonlinear Functions, and many word problems. If you're fluent with the notation, these questions become simple substitution.

## Inputs and outputs

In $f(x) = 3x^2 - 1$, the $x$ in parentheses is the **input** and $f(x)$ is the **output**. To evaluate, replace every $x$ with the input, using parentheses:

$$f(-2) = 3(-2)^2 - 1 = 3(4) - 1 = 11$$

Reading backwards: "$f(a) = 26$" means the output is 26, so solve $3a^2 - 1 = 26$, giving $a = 3$ or $a = -3$.

:::trap Parentheses with negatives and expressions
$f(-2)$ uses $(-2)^2 = 4$, not $-2^2 = -4$. And $f(x + 1)$ means replace every $x$ with $(x + 1)$: $f(x+1) = 3(x+1)^2 - 1$, **not** $3x^2 - 1 + 1$.
:::

### Inputs that aren't just $x$

If $g(x - 2) = 5x$, what is $g(4)$? Ask which $x$ makes the input equal 4: $x - 2 = 4$ gives $x = 6$, so $g(4) = 5(6) = 30$. (Alternatively, let $u = x - 2$, so $x = u + 2$ and $g(u) = 5u + 10$.)

## Function arithmetic and composite functions

- $(f + g)(x) = f(x) + g(x)$; $f(x) \cdot g(x)$ multiplies the outputs.
- A **composite** $f(g(x))$ means: apply $g$ first, then feed that result into $f$. Work from the **inside out**.

:::examples
✓ If $f(x) = 2x + 1$ and $g(x) = x^2$, then $f(g(3)) = f(9) = 19$, while $g(f(3)) = g(7) = 49$. // order matters.
:::

## Functions from tables and graphs

- A **table** lists input–output pairs. To find a rule, check the choices against two or three rows.
- On a **graph**, $f(a)$ is the $y$-coordinate of the point with $x = a$. "For what $x$ is $f(x) = 4$?" means: where does the graph reach height 4?
- "The **maximum value** of $f$" is a $y$-value (how high the graph gets); "the value of $x$ at which $f$ reaches its maximum" is an $x$-value. Read which one the question wants.
- Every point $(a, b)$ on the graph of $f$ means $f(a) = b$. This is how many questions sneak in information: "the graph passes through $(2, 5)$" tells you $f(2) = 5$, which you can plug in to find an unknown constant.

## Zeros, roots, $x$-intercepts, and factors

These four words describe the same idea:

:::rule Zeros
If $f(c) = 0$, then $c$ is a **zero** (or **root**) of $f$, the graph has an **$x$-intercept** at $(c, 0)$, and for a polynomial, $(x - c)$ is a **factor** of $f(x)$.
:::

:::examples
✓ $f(x) = (x - 3)(x + 5)$ has zeros $3$ and $-5$ and crosses the $x$-axis at $(3, 0)$ and $(-5, 0)$.
✓ If $p(4) = 0$ for a polynomial $p$, then $x - 4$ is a factor of $p(x)$. // a favorite one-step question.
:::

Working backwards, a polynomial with zeros $-1$, $0$, and $4$ can be written $p(x) = kx(x + 1)(x - 4)$ for some constant $k$.

The **$y$-intercept** is $f(0)$: plug in $x = 0$.

## When a function is undefined

A rational function is undefined where its **denominator equals zero**: $h(x) = \dfrac{5}{x - 2}$ is undefined at $x = 2$. Set the denominator equal to zero and solve. (A square root of a negative number is also undefined in the real numbers.)

:::tip Desmos
Type the function, e.g. `f(x)=3x^2-1`, then type `f(-2)` on a new line to evaluate it. Click the gray points on the graph to read intercepts and intersections.
:::

:::check
If $g(x) = x^2 - 4x$, what is the value of $g(-3)$?
- [ ] $-21$
- [ ] $-3$
- [ ] $3$
- [x] $21$
> $g(-3) = (-3)^2 - 4(-3) = 9 + 12 = 21$.
:::

:::check
Let $f(x) = 3x - 2$ and $g(x) = x + 4$. What is the value of $f(g(1))$?
- [ ] $5$
- [ ] $7$
- [x] $13$
- [ ] $15$
> Inside first: $g(1) = 5$. Then $f(5) = 15 - 2 = 13$.
:::

:::check
For the polynomial $p$, $p(-6) = 0$. Which of the following must be a factor of $p(x)$?
- [ ] $x - 6$
- [x] $x + 6$
- [ ] $x$
- [ ] $6x$
> A zero at $x = c$ means $(x - c)$ is a factor. Here $c = -6$, so the factor is $x - (-6) = x + 6$.
:::

## Summary

- Substitute inputs with parentheses; "$f(a) = b$" can be read in either direction.
- Composite functions work inside out.
- A point $(a, b)$ on the graph means $f(a) = b$.
- Zero ↔ root ↔ $x$-intercept ↔ factor $(x - c)$; the $y$-intercept is $f(0)$.
- Undefined where a denominator is zero.
