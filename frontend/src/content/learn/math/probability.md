SAT probability questions are almost always about counting from a table or a short description. There's no need for advanced formulas; the key is choosing the right group to divide by.

## Basic probability

$$P(\text{event}) = \frac{\text{number of favorable outcomes}}{\text{total number of possible outcomes}}$$

Probabilities range from 0 (impossible) to 1 (certain). The probability that an event does **not** happen is $1 - P(\text{event})$.

## Probability from a two-way table

| | Passed | Did not pass | Total |
| --- | --- | --- | --- |
| Studied with app | 72 | 18 | 90 |
| Did not use app | 45 | 45 | 90 |
| Total | 117 | 63 | 180 |

- $P(\text{passed}) = \tfrac{117}{180}$ (out of everyone).
- $P(\text{passed and used app}) = \tfrac{72}{180}$.

## Conditional probability

"Given that…," "of the…," "if a person selected… is…" restrict the total to one group. That group's total becomes the **denominator**.

:::rule Conditional probability
$P(A \text{ given } B) = \dfrac{\text{number in both } A \text{ and } B}{\text{number in } B}$
:::

:::examples
✓ If a student who used the app is selected, the probability they passed is $\tfrac{72}{90} = 0.8$. // denominator = app users only.
✓ If a student who passed is selected, the probability they used the app is $\tfrac{72}{117}$. // denominator = students who passed.
:::

:::trap The order matters
"Probability that a person who passed used the app" and "probability that a person who used the app passed" have the same numerator (72) but different denominators (117 vs. 90). Underline the group after "given" or "of the."
:::

"Either A or B" (when no one is in both): add the two counts, then divide by the group total. "Neither A nor B": add up everyone outside both categories.

## Independent events

If two events don't affect each other, multiply their probabilities: the probability of rolling a 6 and then flipping heads is $\tfrac{1}{6} \times \tfrac{1}{2} = \tfrac{1}{12}$.

## Expected counts

To predict how many in a larger group will have a property, multiply the group size by the probability: if 0.8 of app users pass, about $0.8 \times 500 = 400$ of 500 new app users would be expected to pass.

:::check
Using the table above, if a student who did not pass is selected at random, what is the probability that the student did not use the app?
- [ ] $\tfrac{45}{90}$
- [x] $\tfrac{45}{63}$
- [ ] $\tfrac{45}{180}$
- [ ] $\tfrac{63}{180}$
> The condition "did not pass" restricts the group to 63 students; 45 of them did not use the app.
:::

:::check
A bag holds 5 red, 3 blue, and 12 green marbles. One marble is chosen at random. What is the probability that it is NOT green?
- [ ] $\tfrac{3}{20}$
- [x] $\tfrac{2}{5}$
- [ ] $\tfrac{3}{5}$
- [ ] $\tfrac{8}{12}$
> 8 of the 20 marbles are not green: $\tfrac{8}{20} = \tfrac{2}{5}$.
:::

## Summary

- Probability = favorable ÷ total; $P(\text{not } A) = 1 - P(A)$.
- "Given," "of the," "if… is selected" → divide by that group's total.
- Independent events multiply.
- Expected count = group size × probability.
