# 5. Comparative Discussion

<!-- DRAFT v1, Nov 14. Built only from published results, never from our case study.
Numbers in Tables 5.2 and 5.3 are copied from Liu et al. 2012, Table IV(a) and Table VI (authors' copy).
Every other claim is traced to a source in the comment after its paragraph. -->

This section compares the approaches of Sections 3 and 4 using what the surveyed papers report. A direct ranking is not possible: the studies use different datasets, settings and metrics, and many do not use public data at all [Jha2022]. We therefore compare the methods on their properties (Table 5.1) and report published numbers only where one study evaluated several methods under the same conditions (Tables 5.2 and 5.3).

## 5.1 Properties of the approaches

Table 5.1: Approaches compared by their properties as reported in the surveyed literature.

| Approach | Typical learning setting | Input | Anomaly types it targets | Reported strengths | Reported limitations | Sources |
|---|---|---|---|---|---|---|
| Isolation Forest | Unsupervised or semi-supervised | Feature vectors | Outliers; global clusters | Linear time, small memory; robust to swamping and masking through subsampling | Misses local clusters; axis-parallel cuts miss hard anomalies | [Liu2012, Xu2023] |
| One-Class SVM | Semi-supervised | Feature vectors | Outliers | Needs only a small sample of normal data | Slow on large data sets | [Liu2012] |
| LOF / distance-based | Unsupervised | Feature vectors | Scattered outliers | Detects local density differences | Distance computation up to quadratic; dense anomaly clusters look normal | [Liu2012] |
| LSTM / RNN (e.g. DeepLog) | Mostly semi-supervised | Event or token sequences | Sequential anomalies, parameter-value anomalies | Learns event order; most widely used deep architecture | Needs clean normal data; mostly trained offline | [Landauer2023, Jha2022] |
| Autoencoder / GAN | Unsupervised or semi-supervised | Vectors or sequences | Outliers via reconstruction error | Works without labels | Needs a threshold on the error | [Landauer2023] |
| CNN / Transformer (e.g. LogBERT) | Supervised or semi-supervised | Sequences, embeddings | Sequential anomalies | Uses semantic embeddings of log text | Evaluated mainly on a few system-log datasets | [Landauer2023] |
| Deep Isolation Forest | Unsupervised | Feature vectors via random networks | Hard, non-linearly separable outliers | Non-linear isolation with iForest's scalability | Newer, fewer independent evaluations | [Xu2023] |

<!-- "Newer, fewer independent evaluations" for Deep Isolation Forest is our own assessment; drop it if
Member 1 prefers only sourced statements in the table. Learning settings for LSTM/CNN/Transformer from
Landauer2023 Table (DeepLog SEMI, LogBERT SEMI, CNN-based approaches mostly SUP or SEMI). -->

Three patterns stand out. First, the classical methods and Deep Isolation Forest score single data points, while the recurrent and transformer models score sequences, so they target different kinds of anomaly (Section 2.2) and are complementary rather than competing. Second, nearly every approach can be used without anomaly labels, which matches the practical situation described in Section 2.3; among deep models, semi-supervised training dominates [Landauer2023]. Third, scalability separates the classical methods sharply: isolation needs no distance or density computation, which is why Isolation Forest scales linearly where LOF and One-Class SVM do not [Liu2012].

## 5.2 Published results under common conditions

Liu et al. compared Isolation Forest with ORCA (a distance-based method), One-Class SVM and LOF on twelve data sets under the same conditions, all trained without labels and evaluated by AUC [Liu2012]. Table 5.2 shows the three data sets most relevant to this survey: the two largest subsets of the KDD Cup 1999 network intrusion data, one of which consists of HTTP traffic, and a synthetic data set with dense anomaly clusters.

Table 5.2: AUC reported by Liu et al. [Liu2012, Table IV(a)].

| Data set | Isolation Forest | ORCA | One-Class SVM | LOF |
|---|---|---|---|---|
| Http (KDD Cup 1999) | 1.00 | 0.36 | 0.90 | not reported¹ |
| Smtp (KDD Cup 1999) | 0.89 | 0.80 | 0.78 | 0.32 |
| Mulcross (synthetic, clustered anomalies) | 0.96 | 0.33 | 0.59 | 0.59 |

¹ Liu et al. report that LOF failed to run on the largest data sets because of its long run time.

Across all twelve data sets, Isolation Forest compared favourably in AUC with ORCA on nine, with One-Class SVM on eleven and with LOF on seven of the eight on which LOF completed, and it was much faster on every data set larger than a thousand points [Liu2012]. On Http and Mulcross, ORCA scored below random guessing, which the authors attribute to masking: the anomaly clusters are as dense as the normal data [Liu2012].

These figures come from the method's own authors, use default settings and a 2010-era benchmark, and are not a neutral benchmark. The KDD Cup 1999 data in particular is old and synthetic. They show the trade-offs of Section 3, especially the effect of clustered anomalies on distance- and density-based methods, rather than which method is best.

Liu et al. also compared Isolation Forest trained on normal data only with Isolation Forest trained on data containing anomalies, which corresponds to the semi-supervised and unsupervised settings of Section 2.3. The difference was small on most data sets (Table 5.3) [Liu2012]. Section 6 repeats this comparison on web requests and finds a much larger gap, and explains why.

Table 5.3: AUC of Isolation Forest trained on normal instances only versus on normal instances and anomalies [Liu2012, Table VI], selected data sets.

| Data set | Normal only | Normal and anomalies |
|---|---|---|
| Http (KDD Cup 1999) | 0.99 | 1.00 |
| Smtp (KDD Cup 1999) | 0.88 | 0.89 |
| Mulcross | 1.00 | 0.96 |
| ForestCover | 0.82 | 0.87 |

<!-- Liu2012 text: "iForest compares favourable to ORCA in nine out of the twelve data sets, SVM eleven out
of twelve, LOF seven out of eight and RF four out of four"; "LOF has an extended runtime and RF has a
high memory requirements; they fail to run on large data sets"; Http and Smtp are "the two biggest data
subsets ... of KDD CUP 99 network intrusion data"; ORCA on Http and Mulcross "poorer than random guessing"
due to masking. Section 3.3 now refers to this table instead of quoting a count. (Old note: related-work sentence "outperforms LOF in ten out of
eleven data sets"; both statements are in Liu2012 (different subsets), keep them consistent in the final. -->

## 5.3 Deep learning results

No study among our sources compares the deep models of Section 4 with each other, or with classical methods, under common conditions on web traffic. Landauer et al. survey 62 deep-learning approaches but find that their evaluations rely almost entirely on four system-log datasets (HDFS, BGL, Thunderbird and OpenStack), with differing preprocessing and metrics [Landauer2023]. Numbers reported in individual papers are therefore not comparable, and we do not tabulate them. This gap, together with the shortage of public datasets noted by Jha and Nisha [Jha2022], is one of the open challenges in Section 7.
<!-- Landauer2023 §4.5: "the vast majority of evaluations rely on only four data sets (HDFS, BGL,
Thunderbird, and OpenStack)". "with differing preprocessing and metrics" is a reasonable summary of their
reproducibility section but was not read word for word; soften if Member 1 cannot confirm. -->

## 5.4 Choosing an approach

The comparison suggests choosing by situation rather than by a single score:

- **No labels, single requests, large volume:** isolation-based methods are the cheapest option and the most robust to clustered anomalies [Liu2012].
- **Clean normal traffic available:** semi-supervised methods, either One-Class SVM for small samples or Isolation Forest and autoencoders for larger ones [Liu2012, Landauer2023].
- **Attacks that only show in the order of requests:** sequence models such as LSTMs or transformers, at the cost of needing more data and preprocessing [Landauer2023].
- **Attack labels available and attacks stable:** supervised models, which tend to detect better when labels exist [Landauer2023], but cannot recognise new attack types [Jha2022].

The case study in Section 6 shows how the first two situations play out on real web requests.
