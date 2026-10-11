Triangles are the most heavily tested shape on the SAT. Many of the formulas below are on the reference sheet, but knowing them by heart (and knowing when to use them) saves real time.

## Area

$$A = \frac{1}{2}bh$$

The height must be **perpendicular** to the base. In a right triangle, the two legs are a base and height. In an obtuse triangle, the height may fall outside the triangle.

## Isosceles and equilateral triangles

- **Isosceles**: two equal sides, and the angles opposite them are equal. The altitude from the vertex angle bisects the base. If you're told only that one angle of an isosceles triangle is $40^\circ$, consider both cases: $40^\circ, 40^\circ, 100^\circ$ or $40^\circ, 70^\circ, 70^\circ$.
- **Equilateral**: three equal sides and three $60^\circ$ angles. Its height is $\tfrac{\sqrt{3}}{2}s$ and its area is $\tfrac{\sqrt{3}}{4}s^2$.

## Right triangles and the Pythagorean theorem

$$a^2 + b^2 = c^2 \qquad (c \text{ is the hypotenuse, opposite the right angle})$$

Memorize the common **Pythagorean triples** and their multiples: $3\text{-}4\text{-}5$ (6-8-10, 9-12-15), $5\text{-}12\text{-}13$, $8\text{-}15\text{-}17$, $7\text{-}24\text{-}25$.

## Special right triangles

:::rule Special right triangles
- **45°-45°-90°**: sides in the ratio $x : x : x\sqrt{2}$. The hypotenuse is a leg times $\sqrt{2}$.
- **30°-60°-90°**: sides in the ratio $x : x\sqrt{3} : 2x$. Short leg (opposite 30°) $= x$, long leg (opposite 60°) $= x\sqrt{3}$, hypotenuse $= 2x$.
:::

:::trap Sides aren't proportional to angles
In a 30-60-90 triangle the 60° angle is twice the 30° angle, but the side opposite it is $x\sqrt{3}$, not $2x$.
:::

A square's diagonal splits it into two 45-45-90 triangles; an equilateral triangle's altitude splits it into two 30-60-90 triangles. Answer choices containing $\sqrt{2}$ or $\sqrt{3}$ are a hint that a special triangle is involved.

## Congruent triangles

Congruent triangles have the same shape **and** size: all corresponding sides and angles are equal. They're guaranteed congruent by SSS, SAS, ASA, AAS, or (for right triangles) HL. Note that SSA and AAA do **not** prove congruence.

## Similar triangles

Similar triangles have the same shape but possibly different sizes: corresponding angles are equal and corresponding sides are **proportional**.

- Two pairs of equal angles (AA) are enough to prove similarity.
- A line drawn parallel to one side of a triangle creates a smaller triangle similar to the original.
- Set up proportions with sides in matching positions: $\dfrac{\text{small side}}{\text{big side}} = \dfrac{\text{small side}}{\text{big side}}$.

:::trap Match corresponding sides
Corresponding sides are opposite equal angles, not necessarily in the same position in the drawing. Mark the equal angles first, then pair up the sides.
:::

## Similarity in other shapes

If two figures are similar with a length ratio of $k$, their areas are in the ratio $k^2$ and their volumes in the ratio $k^3$. (More in the Area and Volume lesson.)

## Triangle inequality

Each side of a triangle must be less than the sum of the other two and greater than their difference: $\lvert a - b \rvert < c < a + b$. Sides 3, 4, and 8 can't form a triangle; with sides 5 and 9, the third side is between 4 and 14.

:::check
A right triangle has legs of lengths 9 and 12. What is the length of the hypotenuse?
- [ ] 13
- [x] 15
- [ ] 18
- [ ] 21
> A 3-4-5 triple scaled by 3: 9-12-15. Or $\sqrt{81 + 144} = \sqrt{225} = 15$.
:::

:::check
In a 30°-60°-90° triangle, the hypotenuse has length 14. What is the length of the side opposite the 60° angle?
- [ ] $7$
- [x] $7\sqrt{3}$
- [ ] $14\sqrt{3}$
- [ ] $7\sqrt{2}$
> Hypotenuse $2x = 14$ gives $x = 7$; the long leg is $x\sqrt{3} = 7\sqrt{3}$.
:::

:::check
Triangle $ABC$ is similar to triangle $DEF$, with $A$ corresponding to $D$ and $B$ to $E$. If $AB = 6$, $DE = 15$, and $BC = 8$, what is $EF$?
- [ ] $3.2$
- [ ] $17$
- [x] $20$
- [ ] $24$
> The scale factor is $\tfrac{15}{6} = 2.5$, so $EF = 2.5 \times 8 = 20$.
:::

## Summary

- Area $= \tfrac{1}{2}bh$ with a perpendicular height.
- $a^2 + b^2 = c^2$; learn 3-4-5, 5-12-13, 8-15-17.
- 45-45-90: $x, x, x\sqrt{2}$. 30-60-90: $x, x\sqrt{3}, 2x$.
- Similar triangles: equal angles, proportional sides; areas scale by $k^2$.
