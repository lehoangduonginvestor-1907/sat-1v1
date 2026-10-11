One-Variable Data questions ask about the center and spread of a data set, usually shown in a list, frequency table, dot plot, histogram, or box plot. Most can be answered by reasoning about how the data changes, without heavy calculation.

## Measures of center

- **Mean** (average) $= \dfrac{\text{sum of values}}{\text{number of values}}$.
- **Median**: the middle value when the data are in order. With an even number of values, it's the mean of the two middle values.
- **Mode**: the most frequent value.

:::rule Sum = mean × count
Many average questions are easiest with totals: if 5 numbers average 12, their sum is 60. If a sixth number makes the average 13, the new sum is 78, so the sixth number is 18.
:::

Adding one new value moves the mean toward it: a value above the current mean raises the mean, a value below lowers it, and a value equal to the mean leaves it unchanged.

## Outliers and skew

- The **mean** is pulled toward extreme values (outliers); the **median** barely moves.
- Removing a very large outlier lowers the mean more than the median.
- In data skewed right (a long tail of large values), the mean is usually greater than the median.

## Measures of spread

- **Range** = maximum − minimum.
- **Standard deviation** measures how spread out the values are around the mean. You'll never calculate it on the SAT; you'll **compare** it.

:::tip Comparing standard deviations
The data set whose values are more tightly clustered around the center has the smaller standard deviation. Only the spacing matters, not the size of the numbers: 200, 201, 202, 203 has a much smaller standard deviation than 2, 7, 12, 17. Adding the same number to every value doesn't change the standard deviation (or the range); multiplying every value by a number scales them.
:::

## Frequency tables, dot plots, and histograms

A frequency table lists each value and how many times it occurs. To find the mean, multiply each value by its frequency, add, and divide by the **total frequency** (not the number of rows).

| Score | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| Frequency | 2 | 5 | 8 | 5 |

Mean $= \dfrac{1(2) + 2(5) + 3(8) + 4(5)}{20} = \dfrac{56}{20} = 2.8$. Median: the 10th and 11th values are both 3, so the median is 3.

A **histogram** groups values into intervals; you can find which interval contains the median, but usually not the exact mean.

:::trap Find the median position
With $n$ values in order, the median is at position $\tfrac{n + 1}{2}$. For 20 values that's 10.5, the average of the 10th and 11th. Count through the frequencies cumulatively to find them.
:::

## Box plots

A box plot shows the **five-number summary**: minimum, first quartile ($Q_1$), median, third quartile ($Q_3$), maximum.

- The box spans the middle 50% of the data; its width is the **interquartile range** $Q_3 - Q_1$.
- Each of the four sections holds about 25% of the values.
- A box plot does **not** show the mean.

:::check
The mean of four numbers is 15. When a fifth number is added, the mean becomes 17. What is the fifth number?
- [ ] 17
- [ ] 19
- [ ] 23
- [x] 25
> Original sum $= 4 \times 15 = 60$; new sum $= 5 \times 17 = 85$; fifth number $= 85 - 60 = 25$.
:::

:::check
A data set contains the values 4, 6, 7, 7, 9, and 51. If the value 51 is removed, which statement is true?
- [ ] The mean and median both increase.
- [x] The mean decreases more than the median.
- [ ] The median decreases more than the mean.
- [ ] Neither the mean nor the median changes.
> The mean drops from 14 to 6.6 (the outlier was pulling it up). The median drops only from 7 to 7. So the mean decreases far more.
:::

:::check
Data set A: 10, 20, 30, 40, 50. Data set B: 28, 29, 30, 31, 32. Which statement is true?
- [ ] The two sets have the same standard deviation.
- [x] Set A has a larger standard deviation than set B.
- [ ] Set B has a larger standard deviation than set A.
- [ ] The two sets have different means.
> Both have mean 30, but A's values are much more spread out from 30, so its standard deviation is larger.
:::

## Summary

- Mean = sum ÷ count; work with totals.
- Outliers move the mean, not the median.
- Standard deviation = spread around the mean; compare it, don't compute it.
- In frequency tables, divide by the total frequency; find the median by its position.
- Box plots show quartiles and the median, never the mean.
