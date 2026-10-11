Circles is a small but reliable SAT skill: arcs and sectors, angles in circles, tangent lines, and the equation of a circle in the $xy$-plane. The key idea in most questions is **proportion**: a part of a circle is the same fraction of the whole whether you measure angle, arc length, or area.

## Area and circumference

$$A = \pi r^2 \qquad\qquad C = 2\pi r = \pi d$$

## Arcs and sectors: the proportion idea

A central angle of $\theta$ degrees cuts off the fraction $\dfrac{\theta}{360}$ of the circle.

:::rule Arc length and sector area
$$\text{arc length} = \frac{\theta}{360} \cdot 2\pi r \qquad\qquad \text{sector area} = \frac{\theta}{360} \cdot \pi r^2$$
(With radians: arc length $= r\theta$, sector area $= \tfrac{1}{2}r^2\theta$.)
:::

:::examples
✓ In a circle of radius 6, a $60^\circ$ sector is $\tfrac{60}{360} = \tfrac{1}{6}$ of the circle: arc length $\tfrac{1}{6}(12\pi) = 2\pi$, area $\tfrac{1}{6}(36\pi) = 6\pi$.
:::

:::trap Arc measure vs. arc length
The **measure** of an arc is in degrees (it equals its central angle). Its **length** is a distance. A $90^\circ$ arc in a big circle is longer than a $90^\circ$ arc in a small one.
:::

## Central and inscribed angles

- A **central angle** (vertex at the center) equals its intercepted arc.
- An **inscribed angle** (vertex on the circle) is **half** its intercepted arc, so half the central angle on the same arc.
- An inscribed angle that intercepts a diameter is a right angle ($90^\circ$).

## Radii, tangents, and chords

- All radii of a circle are equal, so a triangle with two radii as sides is isosceles.
- A **tangent** line touches the circle at exactly one point and is **perpendicular** to the radius at that point, which often creates a right triangle.
- A radius perpendicular to a chord bisects the chord.
- Two tangent segments drawn to a circle from the same outside point have equal lengths.
- A circle tangent to the $x$-axis has radius equal to the distance from its center to that axis: center $(h, k)$ gives $r = \lvert k \rvert$ (and $r = \lvert h \rvert$ if tangent to the $y$-axis).

## Equation of a circle

$$(x - h)^2 + (y - k)^2 = r^2$$

has center $(h, k)$ and radius $r$. Note the signs: $(x + 3)^2 + (y - 1)^2 = 16$ has center $(-3, 1)$ and radius 4 (not 16).

### Completing the square

If the equation is expanded, like $x^2 + y^2 - 6x + 10y - 2 = 0$, complete the square in $x$ and in $y$:

$$(x^2 - 6x + 9) + (y^2 + 10y + 25) = 2 + 9 + 25 \;\Rightarrow\; (x - 3)^2 + (y + 5)^2 = 36$$

Center $(3, -5)$, radius 6.

:::tip Point inside, on, or outside?
Plug the point into $(x - h)^2 + (y - k)^2$ and compare with $r^2$: less → inside, equal → on, greater → outside. Desmos also graphs circle equations directly.
:::

:::check
A circle has radius 9. What is the area of a sector with a central angle of $40^\circ$?
- [ ] $2\pi$
- [x] $9\pi$
- [ ] $18\pi$
- [ ] $81\pi$
> $\tfrac{40}{360} \times 81\pi = \tfrac{1}{9} \times 81\pi = 9\pi$.
:::

:::check
What are the center and radius of the circle $(x - 4)^2 + (y + 2)^2 = 49$?
- [ ] center $(-4, 2)$, radius 7
- [x] center $(4, -2)$, radius 7
- [ ] center $(4, -2)$, radius 49
- [ ] center $(4, 2)$, radius 7
> Center $(h, k) = (4, -2)$ because $y + 2 = y - (-2)$; radius $= \sqrt{49} = 7$.
:::

:::check
An inscribed angle intercepts an arc of $110^\circ$. What is the measure of the inscribed angle?
- [x] $55^\circ$
- [ ] $70^\circ$
- [ ] $110^\circ$
- [ ] $220^\circ$
> An inscribed angle is half its intercepted arc: $110^\circ \div 2 = 55^\circ$.
:::

## Summary

- Parts of a circle are proportional: $\tfrac{\theta}{360}$ of the circumference or area.
- Inscribed angle = half the arc; a tangent is perpendicular to the radius.
- $(x - h)^2 + (y - k)^2 = r^2$: watch the signs and take the square root for the radius.
- Complete the square to find the center and radius of an expanded equation.
