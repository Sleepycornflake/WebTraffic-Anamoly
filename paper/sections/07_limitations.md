# 7. Open Challenges and Future Directions

<!-- DRAFT v1, Nov 14 (replaces the earlier bullet list; its points are all kept in 7.2).
Numbers from results/metrics/data_report.json and isolation_forest_run.json. Source notes in comments. -->

The survey and the case study point to several problems that remain open. We first discuss challenges for the field as a whole (Section 7.1) and then the specific limitations of our case study (Section 7.2), several of which are instances of the same challenges.

## 7.1 Challenges for the field

**Datasets.** The most basic obstacle is data. Only 29.55% of the experimental results in the studies reviewed by Jha and Nisha rely on public datasets, and about half of those datasets have been heavily criticised; the authors call for a standardised, up-to-date and properly labelled dataset [Jha2022]. Deep-learning work on logs depends on just four public datasets (HDFS, BGL, Thunderbird and OpenStack) [Landauer2023], all of which record system behaviour rather than web traffic. Public web-attack data such as CSIC 2010 is synthetic, generated against a single application, and more than fifteen years old (Section 6.1). Without current, realistic and shared datasets, results cannot be reproduced or compared (Section 5).

**Labels.** Labelled attack data is hard to collect because attacks keep changing [Jha2022]. As a result, most work uses semi-supervised or unsupervised training, which tends to detect less well than supervised learning [Landauer2023]. Methods that need few labels, or that can make use of a small number of confirmed alerts, remain an important direction.

**Changing traffic and streaming.** Logs and traffic arrive as a continuous stream [Landauer2023], and applications change: new endpoints and parameters are added with each release. A model of "normal" trained once will drift out of date. Most reviewed deep-learning approaches are trained offline [Landauer2023], so online or incremental learning is a natural next step. Our case study shows how sharp this problem can be: a feature that counts unknown parameter names works perfectly on a fixed synthetic shop but would raise false alarms on any real API that adds parameters (Section 7.2).

**Representation.** Classical detectors depend on hand-designed features, and deep models aim to learn representations instead [Yadav2020]. For web traffic, where requests mix structure (methods, paths, parameter names) with free text (parameter values), it is still unclear which representation works best. Deep Isolation Forest [Xu2023] is one example of combining learned representations with a classical detector.

**Context.** Single-request detectors cannot see attacks that only show in the order or frequency of requests (Section 2.2). Sequence models address this for system logs [Landauer2023]; applying them to web sessions and API call sequences is less explored in our sources.

**Thresholds and false alarms.** Most semi-supervised and unsupervised detectors produce a score that must be cut at a threshold [Landauer2023]. Choosing it without labelled data is difficult, and a poorly placed threshold can make an otherwise reasonable model unusable, as Section 6.4 shows. Calibrating thresholds on unlabelled or partially labelled traffic deserves more attention.
<!-- Jha2022 conclusion: 29.55%, half criticised, need for "a standardized, up-to-date, and properly labelled
dataset"; ever-changing attacks make anomaly data hard to gather. Landauer2023: four datasets; labels
scarce and semi-/unsupervised "known to achieve lower detection performance"; stream processing challenge;
DL-3 OFF for most approaches; AD-3 thresholds. Yadav2020 intro: DL overcomes limits of extracted features.
Xu2023 abstract. "Applying them to web sessions ... is less explored in our sources" is deliberately
limited to our sources. -->

## 7.2 Limitations of the case study

The case study in Section 6 is illustrative and has the following limitations.

- **Synthetic traffic from one application.** CSIC 2010 was generated against a single Spanish-language e-commerce site. Real traffic is more varied, so the results do not transfer directly to other applications.
- **Repetition in the data.** No request appears in both the normal and the anomalous test sets, so the labels do not contradict each other. However, only 9,644 of the 36,000 training requests are unique, and the metrics are weighted towards a small number of repeated requests. Some requests labelled anomalous are malformed rather than malicious, as the dataset's authors describe.
- **Hand-designed features.** The 21 features were designed by looking at this dataset, and five of them are effectively attack signatures. Removing those five changes little in Setting A (ROC-AUC 0.811 against 0.804, F1 0.685 against 0.672), because four of them never vary in the training data and are never used.
- **Closed parameter vocabulary.** The `unseen_param_names` feature works because this shop has a fixed set of 20 parameter names. A real API adds parameters over time, so the feature would raise false alarms unless its vocabulary were updated.
- **Features ignored in the semi-supervised setting.** Six features are always zero in the normal training data, and Isolation Forest trained on that data never splits on them: setting them to zero changes none of the 61,065 test scores.
- **The unsupervised setting is transductive.** Setting B fits and scores the same pool, and the 5% pool is an artificial mixture we constructed. Real anomaly rates are unknown.
- **Uncalibrated threshold.** With the default threshold, Setting A flags 44% of normal test requests. Without a labelled validation set we did not adjust it, so the threshold-free measures (ROC-AUC and average precision) are the fairer summary.
- **No tuning.** We used library-default hyperparameters and checked only sensitivity to the random seed.
- **Age and scope of the dataset.** The dataset dates from 2010. Modern API traffic, with JSON bodies, GraphQL queries and authentication tokens, is not represented.
- **Single requests only.** Each request is scored on its own, without session or sequence context, which the sequence models of Section 4 would provide.
<!-- Numbers: data_report.json (0 cross-set duplicates; 9,644 unique of 36,000); isolation_forest_run.json
(ablation 0.811/0.685 vs 0.804/0.672; 44% = 15,966 / 36,000); feature check from notebook 02
(0 of 61,065 scores change). "Unintentional illegal requests" are part of the CSIC 2010 description. -->
