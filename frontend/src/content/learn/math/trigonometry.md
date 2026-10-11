SAT trigonometry is mostly right-triangle trigonometry: sine, cosine, and tangent as ratios of sides. A few questions use the relationship between sine and cosine of complementary angles.

## SOH-CAH-TOA

For an acute angle $\theta$ in a right triangle:

:::rule The three ratios
$$\sin\theta = \frac{\text{opposite}}{\text{hypotenuse}} \qquad \cos\theta = \frac{\text{adjacent}}{\text{hypotenuse}} \qquad \tan\theta = \frac{\text{opposite}}{\text{adjacent}}$$
:::

"Opposite" and "adjacent" depend on which angle you're looking from; the hypotenuse is always the side across from the right angle.

:::examples
✓ In a right triangle with legs 8 and 15 and hypotenuse 17, for the angle opposite the side of length 8: $\sin\theta = \tfrac{8}{17}$, $\cos\theta = \tfrac{15}{17}$, $\tan\theta = \tfrac{8}{15}$.
:::

## Finding a missing side

Write the ratio that uses the known side and the unknown side, then solve.

$$\text{If } \cos 35^\circ = \frac{x}{20}, \text{ then } x = 20\cos 35^\circ \approx 16.4$$

## Given one ratio, find another

If a question gives $\sin\theta = \tfrac{5}{13}$ and asks for $\tan\theta$, draw a right triangle with opposite side 5 and hypotenuse 13, find the missing side with the Pythagorean theorem (12), and read off $\tan\theta = \tfrac{5}{12}$.

## Complementary angles

The two acute angles of a right triangle add to $90^\circ$, and the side opposite one is adjacent to the other. So:

:::rule Cofunction identity
$$\sin\theta = \cos(90^\circ - \theta) \qquad\qquad \cos\theta = \sin(90^\circ - \theta)$$
:::

:::examples
✓ If $\sin 28^\circ = k$, then $\cos 62^\circ = k$.
✓ If $\sin x^\circ = \cos y^\circ$ for acute angles, then $x + y = 90$.
:::

## Two more facts

- $\tan\theta = \dfrac{\sin\theta}{\cos\theta}$ and $\sin^2\theta + \cos^2\theta = 1$.
- A trig function is an operation, like $f$, not a number you can factor out: $\sin(2x) \ne 2\sin x$.

## Trig with similar triangles

Trig ratios depend only on the **angle**, not the size of the triangle. Similar triangles share the same sine, cosine, and tangent for corresponding angles. If two triangles are similar, a ratio found in one applies to the other.

## Special angle values

From the special right triangles:

| $\theta$ | $30^\circ$ | $45^\circ$ | $60^\circ$ |
| --- | --- | --- | --- |
| $\sin\theta$ | $\tfrac{1}{2}$ | $\tfrac{\sqrt{2}}{2}$ | $\tfrac{\sqrt{3}}{2}$ |
| $\cos\theta$ | $\tfrac{\sqrt{3}}{2}$ | $\tfrac{\sqrt{2}}{2}$ | $\tfrac{1}{2}$ |
| $\tan\theta$ | $\tfrac{\sqrt{3}}{3}$ | $1$ | $\sqrt{3}$ |

:::tip Unit circle (rare)
Occasionally a question uses the unit circle: the point at angle $\theta$ is $(\cos\theta, \sin\theta)$. Sine is positive in the top half, cosine in the right half. By quadrant: all positive in I; only sine in II; only tangent in III; only cosine in IV. For any decimal values, Desmos (in the right angle mode) is faster than working them out by hand.
:::

:::check
In right triangle $PQR$, angle $R$ is the right angle, $PQ = 25$, and $QR = 7$. What is $\sin P$?
- [x] $\tfrac{7}{25}$
- [ ] $\tfrac{24}{25}$
- [ ] $\tfrac{7}{24}$
- [ ] $\tfrac{25}{7}$
> The side opposite angle $P$ is $QR = 7$, and the hypotenuse (opposite the right angle $R$) is $PQ = 25$.
:::

:::check
In a right triangle, $\cos A = \tfrac{3}{5}$ for acute angle $A$. What is $\tan A$?
- [ ] $\tfrac{3}{4}$
- [x] $\tfrac{4}{3}$
- [ ] $\tfrac{4}{5}$
- [ ] $\tfrac{5}{3}$
> Adjacent 3, hypotenuse 5, so opposite $= 4$. $\tan A = \tfrac{4}{3}$.
:::

:::check
If $\cos(3x)^\circ = \sin(x + 10)^\circ$ for acute angles, what is the value of $x$?
- [ ] $10$
- [x] $20$
- [ ] $25$
- [ ] $40$
> Sine and cosine of complementary angles are equal: $3x + (x + 10) = 90$, so $4x = 80$ and $x = 20$.
:::

## Summary

- SOH-CAH-TOA, always from the angle you're given.
- Given one ratio, sketch a right triangle and use the Pythagorean theorem.
- $\sin\theta = \cos(90^\circ - \theta)$: complementary angles swap sine and cosine.
- Similar triangles share trig ratios.
