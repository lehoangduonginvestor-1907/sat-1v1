The last group of data skills is about drawing conclusions: Inference from Sample Statistics and Margin of Error, Evaluating Statistical Claims, and Two-Variable Data (scatterplots). These questions are almost entirely conceptual; the right answer is the one that doesn't claim more than the data support.

## Sampling

A **sample** is the group actually studied; the **population** is the larger group you want to learn about.

:::rule Generalizing from a sample
Results can be generalized only to the population the sample was **randomly selected** from. A random sample of students at one school says something about that school, not about all teenagers in the country.
:::

A sample is **biased** if it systematically over-represents some group, such as surveying only people at a gym about exercise habits, or only volunteers who choose to respond.

## Margin of error

A survey estimate like "62% ± 4%" means the true population value is **plausibly** between 58% and 66%. Facts to know:

- A **larger sample** (chosen the same way) gives a **smaller** margin of error; more variability in the population gives a **larger** one.
- An interval for a **mean** is about the average, not about individuals. "Mean shell length $22 \pm 2$ mm" does not mean most shells are between 20 and 24 mm.
- The margin of error doesn't account for bias: a large but biased sample is still unreliable.
- Values outside the interval aren't impossible, just not supported by the data; avoid answer choices that say the true value is "exactly" the estimate.

## Scatterplots and the line of best fit

- **Positive association**: as $x$ increases, $y$ tends to increase. **Negative**: $y$ tends to decrease.
- A **line of best fit** models the trend. Its slope is the predicted change in $y$ per 1-unit increase in $x$; its $y$-intercept is the predicted $y$ when $x = 0$ (which may be meaningless in context).
- To **predict**, read the value from the line, not from a data point.
- A point's **residual** is actual − predicted: positive if the point is above the line, negative if below.

:::tip Linear vs. exponential fits
If the points curve upward more and more steeply, an exponential model fits better than a linear one. Desmos can fit both: `y1 ~ m x1 + b` or `y1 ~ a b^(x1)`.
:::

## Experimental design

| Study type | What it can show |
| --- | --- |
| **Randomized experiment** (subjects randomly **assigned** to treatment or control) | cause and effect, for the population the subjects came from |
| **Observational study** (no random assignment; researchers just observe) | association only, never causation |

:::trap Association is not causation
If an observational study finds that people who drink more tea live longer, you can't conclude tea causes longer life; other factors could explain both. Choose answers that use language like "associated with" unless the study randomly assigned treatments.
:::

Keep two ideas separate:
- **Random selection** of the sample → allows generalizing to the population.
- **Random assignment** to groups → allows cause-and-effect conclusions.

:::check
A researcher randomly selects 300 residents of a city and finds that 45% support a new park, with a margin of error of 5%. Which conclusion is best supported?
- [ ] Exactly 45% of city residents support the park.
- [x] It is plausible that between 40% and 50% of city residents support the park.
- [ ] Between 40% and 50% of all residents of the state support the park.
- [ ] A sample of 150 residents would have a smaller margin of error.
> The interval $45\% \pm 5\%$ applies to the city's population. A smaller sample would have a **larger** margin of error.
:::

:::check
In a study, volunteers were randomly assigned to take either a new sleep supplement or a placebo. Those taking the supplement slept significantly longer. Which conclusion is appropriate?
- [x] The supplement is likely to cause longer sleep for people similar to the volunteers.
- [ ] The supplement causes longer sleep for all adults.
- [ ] Longer sleep causes people to take the supplement.
- [ ] No conclusion about cause can be drawn because the study used volunteers.
> Random assignment supports a causal conclusion, but because the volunteers weren't randomly selected from all adults, the result generalizes only to people like them.
:::

:::check
A line of best fit for a scatterplot is $y = 2.4x + 15$. A data point is $(10, 36)$. What is the residual for this point?
- [x] $-3$
- [ ] $3$
- [ ] $36$
- [ ] $39$
> Predicted: $2.4(10) + 15 = 39$. Residual = actual − predicted $= 36 - 39 = -3$ (the point is below the line).
:::

## Summary

- Generalize only to the population that was randomly sampled; watch for biased samples.
- Margin of error gives a plausible range; bigger samples shrink it.
- Line of best fit: slope = predicted change per unit; predict from the line; residual = actual − predicted.
- Random assignment → causation; observational → association only.
