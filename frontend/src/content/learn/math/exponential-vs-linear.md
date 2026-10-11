The SAT regularly asks you to tell **linear** change from **exponential** change, and to read the numbers in an exponential model. The whole topic rests on one distinction:

:::rule Linear vs. exponential
- **Linear**: the quantity changes by the same **amount** each period (add or subtract a constant). Model: $y = mx + b$.
- **Exponential**: the quantity changes by the same **percent** (factor) each period (multiply by a constant). Model: $y = a \cdot b^x$.
:::

"Increases by 50 people per year" is linear. "Increases by 5% per year" is exponential.

## The exponential model

$$y = a(1 + r)^t \quad \text{(growth)} \qquad\qquad y = a(1 - r)^t \quad \text{(decay)}$$

- $a$ is the **initial value** (the value when $t = 0$).
- $1 + r$ or $1 - r$ is the **growth/decay factor**, where $r$ is the rate as a decimal.
- A factor greater than 1 means growth; between 0 and 1 means decay.

:::examples
✓ $P = 2{,}400(1.03)^t$: starts at 2,400 and grows 3% per year.
✓ $V = 18{,}000(0.85)^t$: starts at 18,000 and loses 15% of its value per year. // factor 0.85 = 1 − 0.15.
:::

## Compound interest

Money growing at an annual rate $r$, compounded $n$ times a year for $t$ years:

$$A = P\left(1 + \frac{r}{n}\right)^{nt}$$

Compounded annually, this is just $A = P(1 + r)^t$.

## The all-purpose model: $y = a \cdot b^{t/k}$

One template covers every exponential question:

:::rule General exponential model
$$y = a \cdot b^{t/k}$$
$a$ = starting value, $b$ = the factor by which the quantity changes, $k$ = how long one such change takes, $t$ = time elapsed (in the **same units** as $k$).
:::

- Doubles every 4 hours: $N = N_0 \cdot 2^{t/4}$.
- Half-life of 10 years: $N = N_0 \left(\tfrac{1}{2}\right)^{t/10}$.
- Triples every 8 months, with $t$ in **years**: $k = \tfrac{8}{12} = \tfrac{2}{3}$ year, so $P = P_0 \cdot 3^{t/(2/3)} = P_0 \cdot 3^{3t/2}$.

Read models the same way in reverse. In $M = 400(0.6)^{3t}$ with $t$ in years, rewrite $3t = \tfrac{t}{1/3}$: the quantity keeps 60% (loses 40%) every $\tfrac{1}{3}$ year, i.e., every 4 months. A model like $1.02^{12t}$ means the 2% growth happens 12 times per $t$ (monthly, if $t$ is years).

:::trap Rates in exponents
Rewriting the time unit changes the factor, not just the exponent. Growth of 10% per year is **not** 5% per half-year: $(1.1)^t = \left(1.1^{1/2}\right)^{2t} \approx (1.0488)^{2t}$.
:::

## Telling them apart in tables and graphs

- In a table with equally spaced inputs, **linear** outputs have constant **differences**; **exponential** outputs have constant **ratios**.
- Linear graphs are straight lines; exponential graphs curve, getting steeper (growth) or flattening toward 0 (decay).
- Eventually, exponential growth exceeds any linear growth.

| $x$ | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| linear | 5 | 8 | 11 | 14 |
| exponential | 5 | 10 | 20 | 40 |

## Linear growth and decay

Linear models still matter: "A tree grows 30 cm per year from an initial height of 120 cm" is $h = 120 + 30t$. The SAT may ask which model fits a description, so focus on whether the change is a fixed amount or a fixed percent.

:::check
A town's population was 12,000 in 2020 and increases by 4% each year. Which function gives the population $t$ years after 2020?
- [ ] $P(t) = 12{,}000 + 0.04t$
- [ ] $P(t) = 12{,}000 + 480t$
- [ ] $P(t) = 12{,}000(0.04)^t$
- [x] $P(t) = 12{,}000(1.04)^t$
> A constant percent increase is exponential with factor $1 + 0.04 = 1.04$ and initial value 12,000. Choice B grows by a fixed 480 per year (linear), which matches only the first year.
:::

:::check
The value of a machine is modeled by $V(t) = 50{,}000(0.92)^t$, where $t$ is the number of years since purchase. What does 0.92 indicate?
- [ ] The value decreases by \$0.92 each year.
- [ ] The value decreases by 92% each year.
- [x] The value decreases by 8% each year.
- [ ] The value increases by 92% each year.
> A factor of 0.92 means each year the machine keeps 92% of its value, so it loses 8%.
:::

:::check
Which table shows a relationship in which $y$ grows exponentially as $x$ increases by 1?
- [ ] $y$: 3, 6, 9, 12
- [x] $y$: 3, 6, 12, 24
- [ ] $y$: 3, 5, 7, 9
- [ ] $y$: 24, 12, 6, 3
> Constant ratio (×2) with growth: 3, 6, 12, 24. A and C have constant differences (linear); D is exponential **decay**.
:::

## Summary

- Same amount each period → linear; same percent each period → exponential.
- $y = a(1 \pm r)^t$: $a$ is the starting value, $1 \pm r$ the factor.
- Match the exponent to the time unit ($2^{t/4}$ for "doubles every 4 hours").
- Tables: constant differences = linear, constant ratios = exponential.
