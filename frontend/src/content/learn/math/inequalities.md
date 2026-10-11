Linear Inequalities questions look like equation questions with one twist, plus a few graph and word-problem patterns. Here's everything they test.

## Solving inequalities

Solve exactly like an equation, with one extra rule:

:::rule Flip the sign
When you **multiply or divide both sides by a negative number**, reverse the inequality sign.
$$-3x + 5 > 17 \;\Rightarrow\; -3x > 12 \;\Rightarrow\; x < -4$$
:::

Adding, subtracting, or multiplying by a positive number never flips the sign.

## Compound inequalities

$-2 < 3x + 1 \le 10$ means both parts at once. Do the same operation to all three parts: subtract 1 → $-3 < 3x \le 9$; divide by 3 → $-1 < x \le 3$.

## Graphs of inequalities

- On a number line, an open circle means $<$ or $>$ (endpoint excluded); a closed circle means $\le$ or $\ge$.
- In the $xy$-plane, $y > mx + b$ is the region **above** the line, drawn **dashed**; $y \le mx + b$ is the region **below** the line, drawn **solid**.
- To decide which side to shade, test a point not on the line (often $(0, 0)$): if it makes the inequality true, shade its side.

:::trap Rewrite in "y =" form first
$2x - 3y > 6$ becomes $y < \tfrac{2}{3}x - 2$ after dividing by $-3$, so the shaded region is **below** the line. Forgetting the flip puts it on the wrong side.
:::

## Systems of inequalities

The solution of a system is the region where all the shaded areas **overlap**. To check whether a point is a solution, plug it into **every** inequality; it must satisfy all of them.

## Word problems

Translate phrases carefully:

| Phrase | Symbol |
| --- | --- |
| at least, no less than, minimum | $\ge$ |
| at most, no more than, maximum | $\le$ |
| more than, exceeds | $>$ |
| fewer than, less than | $<$ |

:::examples
✓ A van can carry at most 1,200 pounds. The driver weighs 180 pounds and each box weighs 40 pounds: $180 + 40b \le 1{,}200$, so $b \le 25.5$. The maximum number of boxes is 25. // round down for "at most."
:::

## Minimum and maximum questions

When a question asks for the greatest or least whole-number value, solve the inequality, then round in the direction that keeps the inequality true. "At least $x \ge 12.3$ hours" means 13 whole hours; "at most $b \le 25.5$ boxes" means 25.

When several resources limit production (flour, sugar, oven time…), compute the maximum allowed by each one separately; the **smallest** of those is the real limit.

## Greatest or least value in a system

For "what is the maximum possible value of $y$" in a system of inequalities, graph the system: the extreme values occur at the **corners** of the overlapping region. Click the corner points in Desmos. If working algebraically, you may add inequalities that point the same way, but never subtract one inequality from another.

:::tip Desmos
Desmos graphs inequalities directly (type `y>2x-1`) and shades the overlap of a system. You can also enter a point like `(3,4)` to see whether it lies in the shaded region.
:::

:::check
Which value of $x$ satisfies $5 - 2x \ge 13$?
- [x] $-5$
- [ ] $-3$
- [ ] $0$
- [ ] $4$
> $-2x \ge 8 \Rightarrow x \le -4$ (the sign flips). Only $-5$ is less than or equal to $-4$.
:::

:::check
A student needs an average of at least 85 on four tests. Her first three scores are 82, 79, and 88. What is the minimum score she needs on the fourth test?
- [ ] 85
- [ ] 88
- [x] 91
- [ ] 94
> $\tfrac{82 + 79 + 88 + s}{4} \ge 85 \Rightarrow 249 + s \ge 340 \Rightarrow s \ge 91$.
:::

:::check
Which point lies in the solution region of the system $y > x + 1$ and $y < -x + 5$?
- [ ] $(0, 0)$
- [x] $(1, 3)$
- [ ] $(3, 1)$
- [ ] $(2, 4)$
> Test each: $(1, 3)$: $3 > 2$ ✓ and $3 < 4$ ✓. $(0,0)$ fails the first; $(3,1)$ fails the first; $(2,4)$: $4 > 3$ ✓ but $4 < 3$ ✗.
:::

## Summary

- Solve like an equation, but flip the sign when multiplying or dividing by a negative.
- Dashed line for strict inequalities, solid for ≤ / ≥; test a point to choose the side.
- Systems: the overlap of all regions; a solution must satisfy every inequality.
- Translate "at least/at most" carefully and round in the direction that keeps the inequality true.
