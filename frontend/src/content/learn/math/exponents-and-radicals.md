Exponent and radical questions show up in Equivalent Expressions and Nonlinear Equations. They're rarely hard once the rules are automatic, but the SAT loves to disguise a simple rule inside an intimidating expression. This lesson gives you every rule you need and the common slips to avoid.

## The laws of exponents

:::rule Exponent laws
| Rule | In symbols | Example |
| --- | --- | --- |
| multiply same base → add exponents | $a^m \cdot a^n = a^{m+n}$ | $x^3 \cdot x^4 = x^7$ |
| divide same base → subtract exponents | $\dfrac{a^m}{a^n} = a^{m-n}$ | $\dfrac{y^9}{y^2} = y^7$ |
| power of a power → multiply exponents | $(a^m)^n = a^{mn}$ | $(k^2)^5 = k^{10}$ |
| power of a product | $(ab)^n = a^n b^n$ | $(3x)^2 = 9x^2$ |
| power of a quotient | $\left(\dfrac{a}{b}\right)^n = \dfrac{a^n}{b^n}$ | $\left(\dfrac{2}{t}\right)^3 = \dfrac{8}{t^3}$ |
| zero exponent | $a^0 = 1$ (for $a \ne 0$) | $57^0 = 1$ |
| negative exponent | $a^{-n} = \dfrac{1}{a^n}$ | $4^{-2} = \dfrac{1}{16}$ |
| fractional exponent | $a^{m/n} = \sqrt[n]{a^m}$ | $8^{2/3} = (\sqrt[3]{8})^2 = 4$ |
:::

The rules for adding and subtracting exponents only work when the **bases are the same**. $2^3 \cdot 3^4$ can't be combined into one power.

:::trap Common slips
- $(x + y)^2 \ne x^2 + y^2$. Exponents distribute over multiplication, never over addition. $(x+y)^2 = x^2 + 2xy + y^2$.
- $-3^2 = -9$, but $(-3)^2 = 9$. Without parentheses, the exponent applies only to the 3.
- $2x^3$ means $2 \cdot x^3$, not $(2x)^3 = 8x^3$.
- A negative exponent makes a reciprocal, not a negative number: $5^{-1} = \tfrac{1}{5}$, not $-5$.
- Adding equal powers doesn't change the base: $3^x + 3^x + 3^x = 3 \cdot 3^x = 3^{x+1}$, not $9^x$.
- Odd powers keep a negative sign, even powers remove it: $(-y)^3 = -y^3$ but $(-y)^4 = y^4$.
:::

## Using the laws in reverse

Many questions need the rules run backwards: splitting an exponent apart, or combining different bases that share an exponent.

$$5^{x+2} = 5^x \cdot 5^2 = 25 \cdot 5^x \qquad\qquad 2^{x} \cdot 7^{x} = 14^{x} \qquad\qquad 9^{x} \cdot 2^{x+1} = 2 \cdot 18^{x}$$

A common setup gives an equation like $\dfrac{x^{a^2}}{x^{b^2}} = x^{12}$ with $a - b = 2$: the exponents give $a^2 - b^2 = 12$, and factoring $(a + b)(a - b) = 12$ yields $a + b = 6$.

## Fractional exponents and roots

A fractional exponent is just a root in disguise: the **denominator is the root** and the **numerator is the power**.

$$x^{3/4} = \sqrt[4]{x^3} = \left(\sqrt[4]{x}\right)^3$$

When a question gives a root and answer choices with fractional exponents (or the reverse), translate one form into the other and compare.

:::examples
✓ $\sqrt{x^5} = x^{5/2}$ // square root = power of 1/2, so the exponent 5 is divided by 2.
✓ $\dfrac{1}{\sqrt[3]{y}} = y^{-1/3}$ // a root in the denominator gives a negative fractional exponent.
✗ $\sqrt[3]{x^6} = x^{3}$ // The 3rd root divides the exponent by 3: $x^{6/3} = x^2$.
:::

## Solving exponential equations: match the bases

If two powers with the same base are equal, their exponents are equal. So the strategy is to rewrite both sides with a **common base**.

:::steps
1. Look for a base that both sides can be written in (2, 3, 5, 10 are the usual suspects: $4 = 2^2$, $8 = 2^3$, $27 = 3^3$, $\tfrac{1}{9} = 3^{-2}$).
2. Rewrite each side as a single power of that base.
3. Set the exponents equal and solve the resulting linear equation.
:::

:::examples
✓ $4^{x} = 8^{x-1}$ → $2^{2x} = 2^{3(x-1)}$ → $2x = 3x - 3$ → $x = 3$ // both sides as powers of 2.
:::

:::tip Desmos shortcut
For "solve for $x$" questions you can graph each side as its own function ($y = 4^x$ and $y = 8^{x-1}$) and click the intersection. The $x$-coordinate is the solution.
:::

## Simplifying square roots

Pull perfect-square factors out of the root: $\sqrt{ab} = \sqrt{a}\,\sqrt{b}$.

$$\sqrt{72} = \sqrt{36 \cdot 2} = 6\sqrt{2}$$

Always look for the **largest** perfect square factor (36 here, not 4 or 9), or simplify in several steps. To compare a messy radical with answer choices, you can also just evaluate both on a calculator.

- Cube roots work the same way with perfect **cubes**: $\sqrt[3]{54} = \sqrt[3]{27 \cdot 2} = 3\sqrt[3]{2}$.
- To move a number back **inside** a root, raise it to the root's index: $4\sqrt{3} = \sqrt{16 \cdot 3} = \sqrt{48}$, and $2\sqrt[3]{5} = \sqrt[3]{40}$.
- Nested roots become exponents: $\sqrt{x\sqrt{x}} = \left(x \cdot x^{1/2}\right)^{1/2} = \left(x^{3/2}\right)^{1/2} = x^{3/4}$.

:::trap Roots don't split over addition
$\sqrt{9 + 16} = \sqrt{25} = 5$, not $\sqrt{9} + \sqrt{16} = 7$.
:::

:::check
Which expression is equivalent to $\dfrac{x^{5} \cdot x^{-2}}{x^{4}}$, where $x > 0$?
- [ ] $x^{-3}$
- [x] $x^{-1}$
- [ ] $x^{1}$
- [ ] $x^{7}$
> Multiply by adding exponents: $x^{5 + (-2)} = x^3$. Then divide by subtracting: $x^{3-4} = x^{-1}$.
:::

:::check
If $9^{a} = 27^{2}$, what is the value of $a$?
- [ ] $\tfrac{2}{3}$
- [ ] $2$
- [x] $3$
- [ ] $6$
> Write both sides as powers of 3: $9^a = 3^{2a}$ and $27^2 = (3^3)^2 = 3^6$. So $2a = 6$ and $a = 3$.
:::

:::check
Which expression is equivalent to $\sqrt[3]{m^{2}}$, where $m > 0$?
- [ ] $m^{6}$
- [ ] $m^{3/2}$
- [x] $m^{2/3}$
- [ ] $m^{-1/3}$
> The root index (3) goes in the denominator and the power (2) in the numerator: $m^{2/3}$.
:::

## Summary

- Same base: multiply → add exponents, divide → subtract, power of a power → multiply.
- Negative exponent = reciprocal; fractional exponent = root (denominator) and power (numerator).
- Solve exponential equations by rewriting both sides with a common base, or with Desmos.
- Simplify roots by pulling out the largest perfect square; roots and exponents never split over addition.
