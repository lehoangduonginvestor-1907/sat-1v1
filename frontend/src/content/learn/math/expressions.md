Equivalent Expressions questions ask you to rewrite an expression: "Which expression is equivalent to…?" There's nothing to solve, only algebra to carry out carefully. This lesson covers the four moves you'll use: combining like terms, expanding, factoring, and working with fractions.

## Combining like terms

**Like terms** have exactly the same variable part: $3x^2$ and $-7x^2$ are like terms; $3x^2$ and $3x$ are not. Add or subtract their coefficients and keep the variable part unchanged.

$$(4x^2 - 3x + 5) - (x^2 + 2x - 6) = 3x^2 - 5x + 11$$

:::trap Distribute the minus sign
Subtracting a group means subtracting **every** term in it. $-(x^2 + 2x - 6) = -x^2 - 2x + 6$. Forgetting to flip the last sign is the most common mistake in this whole topic.
:::

## Expanding

Multiply every term in one factor by every term in the other.

| Pattern | Result |
| --- | --- |
| $(a+b)^2$ | $a^2 + 2ab + b^2$ |
| $(a-b)^2$ | $a^2 - 2ab + b^2$ |
| $(a+b)(a-b)$ | $a^2 - b^2$ |
| $(x+p)(x+q)$ | $x^2 + (p+q)x + pq$ |

:::examples
✓ $(2x-3)(x+4) = 2x^2 + 8x - 3x - 12 = 2x^2 + 5x - 12$ // four products, then combine the middle terms.
✗ $(x+5)^2 = x^2 + 25$ // missing the middle term $2 \cdot x \cdot 5 = 10x$.
✗ $3(x+1)(x-2) = (3x+3)(3x-6)$ // a constant multiplies only **one** factor; this version multiplies by 9.
:::

## Factoring

Factoring reverses expanding. Try these in order:

1. **Greatest common factor**: $6x^3 - 9x^2 = 3x^2(2x - 3)$.
2. **Difference of squares**: $a^2 - b^2 = (a+b)(a-b)$, e.g. $49 - 4y^2 = (7 + 2y)(7 - 2y)$.
3. **Trinomials** $x^2 + bx + c$: find two numbers that multiply to $c$ and add to $b$. $x^2 - x - 12 = (x-4)(x+3)$.
4. When the leading coefficient isn't 1, factor out a common number first if you can, or check the answer choices by expanding them.
5. **Common chunk**: if a whole expression repeats, treat it as one variable. In $5x(x - 2) + 3(x - 2)$, let $A = x - 2$: $5xA + 3A = A(5x + 3) = (x - 2)(5x + 3)$.

Keep factoring until nothing more factors: $x^4 - 16 = (x^2 + 4)(x^2 - 4) = (x^2 + 4)(x + 2)(x - 2)$. A **sum** of squares like $x^2 + 4$ doesn't factor.

:::tip Test a number
When the answer choices are complicated, pick a simple value such as $x = 2$ (avoid 0 and 1, which make many expressions look alike). Evaluate the original expression and each choice; only the equivalent one gives the same result. In Desmos you can also graph the original and a choice: equivalent expressions produce the identical graph.
:::

## Fractions with variables

The rules are the same as for number fractions.

- **Combine** fractions over a common denominator: $\dfrac{3}{x} + \dfrac{2}{x+1} = \dfrac{3(x+1) + 2x}{x(x+1)} = \dfrac{5x + 3}{x(x+1)}$.
- **Split** a fraction whose numerator is a sum: $\dfrac{6x + 4}{2} = 3x + 2$, and $\dfrac{x^2 + 5x}{x} = x + 5$ (for $x \ne 0$).
- **Cancel** only common **factors**, never terms: $\dfrac{x(x+2)}{x} = x + 2$, but $\dfrac{x + 2}{x}$ does **not** simplify to $2$.
- **Divide** by a fraction by multiplying by its reciprocal. With stacked fractions, find the main (longest) fraction bar first: $\dfrac{x}{\;\tfrac{a}{b}\;} = \dfrac{bx}{a}$, while $\dfrac{\;\tfrac{a}{b}\;}{x} = \dfrac{a}{bx}$.
- **Factor denominators before** finding a common denominator. In $\dfrac{4}{x+2} + \dfrac{8}{x^2+2x}$, the second denominator is $x(x+2)$, so the common denominator is just $x(x+2)$: the sum is $\dfrac{4x + 8}{x(x+2)} = \dfrac{4}{x}$.

:::trap You can't split a denominator
$\dfrac{6}{x + 2} \ne \dfrac{6}{x} + \dfrac{6}{2}$. A sum in the numerator splits; a sum in the denominator doesn't.
:::

## Long division shortcut

Some questions write a fraction like $\dfrac{x^2 + 3x + 5}{x + 1}$ as "a polynomial plus a remainder over $x+1$." Instead of full polynomial long division, you can rewrite the numerator to contain the denominator: $x^2 + 3x + 5 = (x+1)(x+2) + 3$, so the expression equals $x + 2 + \dfrac{3}{x+1}$.

:::check
Which expression is equivalent to $(3x^2 - 2x + 7) - (x^2 - 5x + 2)$?
- [ ] $2x^2 - 7x + 5$
- [x] $2x^2 + 3x + 5$
- [ ] $2x^2 + 3x + 9$
- [ ] $4x^2 - 7x + 9$
> Distribute the minus: $3x^2 - 2x + 7 - x^2 + 5x - 2 = 2x^2 + 3x + 5$.
:::

:::check
Which expression is equivalent to $9x^2 - 25$?
- [ ] $(3x - 5)^2$
- [ ] $(9x - 5)(x + 5)$
- [x] $(3x + 5)(3x - 5)$
- [ ] $(3x - 25)(3x + 1)$
> $9x^2 = (3x)^2$ and $25 = 5^2$, so it's a difference of squares: $(3x+5)(3x-5)$.
:::

:::check
Which expression is equivalent to $\dfrac{4x^2 + 8x}{4x}$, for $x > 0$?
- [ ] $x + 8x$
- [x] $x + 2$
- [ ] $4x + 2$
- [ ] $x^2 + 2$
> Split the numerator: $\dfrac{4x^2}{4x} + \dfrac{8x}{4x} = x + 2$. (Or factor: $\dfrac{4x(x+2)}{4x}$.)
:::

## Summary

- Combine only like terms; distribute a minus sign to every term.
- Know the square and difference-of-squares patterns cold.
- Factor: GCF first, then special patterns, then trinomials.
- Split numerators, never denominators; cancel factors, never terms.
- Stuck? Plug in a number or compare graphs in Desmos.
