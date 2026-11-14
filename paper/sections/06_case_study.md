# 6. Case Study: Isolation Forest on HTTP DATASET CSIC 2010

<!-- DRAFT v1, Nov 7. Numbers come from results/metrics/isolation_forest_run.json and data_report.json
(local run: Python 3.13.9, scikit-learn 1.7.2, seed 42). If the Colab run differs, update the numbers
and the environment sentence in 6.3.
Citation placeholders in [Square brackets] are replaced with Mendeley Cite in Word:
  [CSIC2010] Torrano-Giménez, Pérez-Villegas, Álvarez Marañón, HTTP DATASET CSIC 2010
  [Xu2023]   Xu, Pang, Wang, Wang, Deep Isolation Forest for Anomaly Detection, IEEE TKDE 2023
  [Liu2012]  Liu, Ting, Zhou, Isolation-based Anomaly Detection, ACM TKDD 2012
  [Landauer2023] Landauer, Onder, Skopik, Wurzenberger, Deep learning for anomaly detection in log data: A survey, MLWA 2023
Section references now point at 02_background.md (2.3 = learning settings) and 03_traditional_ml.md (3.1 = Isolation Forest). -->

This section works through one of the methods surveyed in Section 3, Isolation Forest [Liu2012] (Section 3.1), on a public web-attack dataset. The aim is to illustrate, on real HTTP requests, three points that the survey makes in the abstract: what feature engineering involves when the input is raw web traffic, how the choice of training setting (Section 2) changes what a model can learn, and why metric choice matters for imbalanced detection problems. It is a worked example, not a benchmark: we run a single model with library-default hyperparameters and make no claim about which method performs best.

## 6.1 Dataset

We use HTTP DATASET CSIC 2010 [CSIC2010], published by the Information Security Institute of the Spanish National Research Council (CSIC). It contains synthetic HTTP traffic generated against a Spanish-language e-commerce web application. The anomalous traffic covers SQL injection, buffer overflow, information gathering, file disclosure, CRLF injection, cross-site scripting (XSS), server-side include and parameter tampering. It also includes requests for hidden or non-existent resources ("static" attacks) and malformed requests that are not malicious.

The dataset comes with an official split into three files: a training set containing only normal traffic, a normal test set, and an anomalous test set. This split matches the semi-supervised (novelty-detection) setting described in Section 2, in which a model learns only from normal behaviour. We use the raw text version of the dataset rather than a pre-processed feature table, so turning requests into features (Section 6.2) is part of the method.

We parsed all three files with no parse failures (Table 6.1). The two normal files match the official count of 36,000 requests each. The anomalous file contains 25,065 requests.
<!-- TODO: confirm the exact official anomalous count on the dataset page; the brief says "25,000+". -->

Table 6.1: The three files of CSIC 2010 after parsing.

| File | Role | Label | Requests | Unique requests | Methods |
|---|---|---|---|---|---|
| normalTrafficTraining | training | normal | 36,000 | 9,644 | 28,000 GET, 8,000 POST |
| normalTrafficTest | test | normal | 36,000 | 9,622 | 28,000 GET, 8,000 POST |
| anomalousTrafficTest | test | anomalous | 25,065 | 15,954 | 15,088 GET, 9,580 POST, 397 PUT |

*Unique requests compare method, path, query string and body; headers are ignored (see 6.2).*

Checking the labels revealed three properties that matter for the results:

- **Heavy repetition.** Only 9,644 of the 36,000 training requests are unique. The generator requests 20 parameter-free pages exactly 1,000 times each, so 20,000 training requests have neither a query string nor a body. Repetition in the anomalous file is lower but still large: 9,111 of its 25,065 requests repeat an earlier one.
- **No overlap between classes.** No request appears in both the normal and the anomalous test sets, so the labels do not contradict each other at the level of request content. The normal training and normal test sets share 626 unique requests, which is expected given that both come from the same generator.
- **Anomalies that only rename a parameter.** The most frequent anomalies keep normal values but change a parameter name (for example `id` becomes `idA`). Such requests look normal under any feature that measures only the values, which motivated the `unseen_param_names` feature below.

## 6.2 From raw HTTP requests to features

Each raw request consists of a request line (method and URL), a block of headers, a blank line and an optional body. We parse each request into method, path, query string, headers and body. We exclude headers from the features: they are nearly identical across the whole dataset, and the one field that varies, the session cookie, holds a random identifier that carries no information about the request. The *payload* of a request is the percent-decoded set of parameter names and values from the query string and the body together. The files are Latin-1 encoded, and Spanish characters appear as percent-encoded Latin-1 bytes.

From each request we extract the 21 numeric features in Table 6.2. They fall into three groups:

- Structural features (1–10): sizes and counts that describe the shape of the request.
- Character-distribution features (11–16): how the characters in the payload are distributed.
- Signature-like features (17–21): keyword and pattern matches for specific attack types.

The last group is close to the rule-based detection that ML methods are often contrasted with. We include it deliberately so that its contribution can be measured (Section 6.4).

Two features use knowledge of this dataset and are discussed as limitations in Section 7:

- `unseen_param_names` counts parameter names that never occur in the normal training traffic. The vocabulary of 20 names is built from the training split only, so the feature stays within the normal-only setting.
- `crlf_flag` checks the payload both raw and once-decoded, because the CRLF attacks in this dataset are double-encoded (`%250D%250A`). A check of only the raw form never fires.

Table 6.2: Features extracted from each request (generated by `python src/features.py --markdown`).

| # | Feature | Definition | Why |
|---|---|---|---|
| 1 | `is_post` | 1 if method is POST, else 0 | Attack payloads can arrive in the body instead of the URL; lets the model treat the two cases differently. |
| 2 | `path_length` | Characters in the URL path | Static attacks request unusual or long resource paths. |
| 3 | `path_depth` | Number of '/' segments in the path | Directory probing and traversal change path depth. |
| 4 | `nonstandard_extension` | 1 if the path's file extension is not a normal page/asset type (.jsp, .html, images, css, js) | Captures requests for hidden/backup files (static attacks). App-informed: chosen by looking at this shop's URLs. |
| 5 | `query_length` | Characters in the raw query string | Injected payloads make the query longer. |
| 6 | `body_length` | Characters in the raw body | Same as query_length, for POST payloads. |
| 7 | `num_params` | Number of key=value parameters in query + body | Parameter tampering can add or drop parameters. |
| 8 | `unseen_param_names` | Number of parameter names in the request that never occur in the normal training traffic | Catches tampering that only renames a parameter (e.g. id -> idA) and leaves values normal. Learned from the training split only, so it stays within the normal-only setting. |
| 9 | `max_param_value_length` | Length of the longest decoded parameter value | Buffer-overflow and injection attempts produce one very long value. |
| 10 | `mean_param_value_length` | Mean decoded parameter value length (0 if no params) | Less sensitive to a single outlier than the max; describes the request as a whole. |
| 11 | `special_char_count` | Count of special characters (quotes, brackets, terminators) in the decoded payload | SQLi, XSS and command injection all need quoting, brackets or terminators. |
| 12 | `pct_escape_count` | Number of %XX escapes in the raw payload | Attackers percent-encode to hide characters; normal Spanish input only escapes a few accented letters. |
| 13 | `digit_ratio` | Digits / payload length | Normal fields (price, quantity, id) are digit-heavy; injected text shifts the ratio. |
| 14 | `letter_ratio` | Letters / payload length | Complements digit_ratio; injected keywords and scripts are letter-heavy. |
| 15 | `non_alnum_ratio` | Non-alphanumeric, non-space characters / payload length | Normalised version of special_char_count, independent of payload size. |
| 16 | `payload_entropy` | Shannon entropy (bits/char) of the decoded payload | Encoded or obfuscated payloads have a different character distribution than ordinary form text. |
| 17 | `sql_keyword_count` | Matches of SQL keywords/comment markers in the decoded payload | Direct signal for SQL injection (signature-like; see limitations). |
| 18 | `xss_keyword_count` | Matches of script/event-handler patterns in the decoded payload | Direct signal for XSS (signature-like; see limitations). |
| 19 | `path_traversal_flag` | 1 if '../' or a known system file name appears in path or payload | File disclosure attempts. |
| 20 | `ssi_cmd_flag` | 1 if SSI directives or shell command patterns appear in the decoded payload | Server-side include and command injection attempts. |
| 21 | `crlf_flag` | 1 if CR/LF (raw or %0d/%0a) appears in the raw or once-decoded payload | CRLF injection. Checking the decoded payload too catches the double-encoded form (%250D%250A) used in this dataset. |

Six of the 21 features are zero for every one of the 36,000 normal training requests:

- `nonstandard_extension`
- `unseen_param_names`
- `xss_keyword_count`
- `path_traversal_flag`
- `ssi_cmd_flag`
- `crlf_flag`

This is expected, since they were designed to fire on attacks. It turns out to matter a great deal for Isolation Forest (Section 6.5).

## 6.3 Experimental setup

**Model.** Isolation Forest [Liu2012] builds an ensemble of random binary trees. Each tree is grown on a small random subsample: at every node it picks a random feature and a random split value between that feature's minimum and maximum. Points that are "few and different" are separated from the rest after only a few splits, so a short average path length from the root signals an anomaly. We use the scikit-learn implementation with the defaults recommended by Liu et al. (Table 6.3). We did not tune any hyperparameter. `contamination="auto"` places the decision threshold at the score cut-off proposed by Liu et al. instead of assuming a known anomaly rate, which a real deployment would not have.

Table 6.3: Isolation Forest configuration, identical in both settings.

| Parameter | Value |
|---|---|
| Number of trees (`n_estimators`) | 100 |
| Subsample size per tree (`max_samples`) | 256 |
| Features per tree (`max_features`) | all 21 |
| Bootstrap | no |
| Threshold (`contamination`) | `"auto"` |
| Random seed | 42 (five seeds for the sensitivity check) |

**Two training settings.** To connect the case study to the learning settings of Section 2.3, we fit the same model in two ways. Labels are never used for fitting, only for evaluation.

- **Setting A, semi-supervised (novelty detection):** the model is fitted on the 36,000 normal training requests and scores the 61,065 test requests (36,000 normal, 25,065 anomalous). This is the setting the official split was designed for.
- **Setting B, unsupervised:** the model is fitted on an unlabelled mixture of normal and anomalous requests and then scores that same mixture. Isolation Forest assumes anomalies are rare, but the test set is 41% anomalous. So our main pool for Setting B combines all 36,000 normal test requests with a random sample of 1,895 anomalous requests (seed 42), giving an anomaly rate of 5%. We also fit Setting B on the full 41% test set to show what happens when that assumption is broken. Because B fits and scores the same data, it is transductive: it shows how well the model can single out anomalies within a batch of traffic, not how it would generalise to new traffic.

So that the two settings can be compared on equal terms, we also score the Setting A model on the 5% pool.

**Metrics.** We report recall (the share of attacks that are flagged) and F1 first, followed by precision. For a detector, a missed attack is usually the costlier error, and these measures focus on the anomalous class. They depend on the decision threshold, so we also report two threshold-free measures computed from the anomaly scores: ROC-AUC and average precision (AP). Accuracy is reported last because it is misleading on imbalanced data. On the 5% pool, a model that flags nothing would score 95% accuracy while catching no attacks. Precision, AP and accuracy depend on the anomaly rate, so we compare them only between rows evaluated on the same pool. ROC-AUC does not depend on the anomaly rate.

**Robustness checks.**

- **Seed sensitivity:** we repeat each setting with five random seeds (0, 1, 2, 3, 42). For Setting B the seed also changes which anomalies are drawn into the 5% pool.
- **Ablation:** we refit Setting A without the five signature-like features (17–21) to see how much the results depend on hand-written attack patterns.

**Environment.** Python 3.13.9, scikit-learn 1.7.2, pandas 2.3.3, numpy 2.3.5. The code, the parameters of every run and the exact metric values are in the project repository.
<!-- TODO: if the Colab run is used as the reported run, replace with Colab's versions. Add the repo URL if the course allows it. -->

## 6.4 Results

**Setting A on the official test set.** Fitted on normal traffic only, the model flags 20,778 of the 25,065 anomalous requests (recall 0.829), with precision 0.565 and F1 0.672 (Table 6.4, Figure 6.1). The ranking produced by the anomaly scores is moderately good: ROC-AUC 0.804 and AP 0.760 (Figure 6.2). The main weakness is the default threshold. It flags 15,966 of the 36,000 normal test requests, a false-positive rate of 44%. The score histogram (Figure 6.3) shows that the normal and anomalous score distributions overlap heavily around the threshold.

Table 6.4: Setting A (normal-only training), full test set, seed 42.

| Recall | Precision | F1 | ROC-AUC | AP | Accuracy |
|---|---|---|---|---|---|
| 0.829 | 0.565 | 0.672 | 0.804 | 0.760 | 0.668 |

Confusion matrix: 20,034 true negatives, 15,966 false positives, 4,287 false negatives, 20,778 true positives.

Figure 6.1: Confusion matrix for Setting A at the default threshold. (`results/figures/if_confusion_matrix.png`)

Figure 6.2: ROC curve for Setting A. (`results/figures/if_roc_curve.png`)

Figure 6.3: Distribution of anomaly scores for normal and anomalous test requests in Setting A; the dashed line is the default threshold. (`results/figures/if_score_histogram.png`)

**Setting A compared with Setting B.** Table 6.5 compares the two settings. On the 5% pool, which has the same normal requests and anomaly sample for both settings, the unsupervised model ranks requests better (ROC-AUC 0.930 compared with 0.800). At the default threshold it reaches about the same recall (0.829 vs 0.823) while producing far fewer false positives (4,782 vs 15,966). As a result its precision is higher (0.247 vs 0.089) and so is its F1 (0.381 vs 0.161). Figure 6.4 shows the two ROC curves. Precision is low for both settings on this pool because only 5% of its requests are anomalous: even a modest false-positive rate on 36,000 normal requests outnumbers 1,895 attacks.

On the full 41% test set, the unsupervised model behaves very differently. It raises no false alarms at all (precision 1.000), but it flags only 6,861 of the 25,065 anomalies (recall 0.274). Its threshold-free scores stay fairly high (ROC-AUC 0.908, AP 0.890), so most of the drop in recall comes from the default threshold. With so many anomalies in the data, few of them get a score above the cut-off.

Table 6.5: Settings compared, seed 42. Compare precision, AP and accuracy only within the same pool.

| Pool (anomaly rate) | Setting | Recall | Precision | F1 | ROC-AUC | AP | Accuracy |
|---|---|---|---|---|---|---|---|
| 5% pool (n = 37,895) | A: normal-only | 0.823 | 0.089 | 0.161 | 0.800 | 0.338 | 0.570 |
| 5% pool (n = 37,895) | B: unsupervised | 0.829 | 0.247 | 0.381 | 0.930 | 0.676 | 0.865 |
| Full test set, 41% (n = 61,065) | A: normal-only | 0.829 | 0.565 | 0.672 | 0.804 | 0.760 | 0.668 |
| Full test set, 41% (n = 61,065) | B: unsupervised | 0.274 | 1.000 | 0.430 | 0.908 | 0.890 | 0.702 |

Figure 6.4: ROC curves for Settings A and B on the 5% pool. (`results/figures/if_roc_settings.png`)

**Which features the models use.** Inspecting the fitted trees shows that the Setting A model never splits on the six features that are constant in the training data (Section 6.2). Setting these six features to zero changes none of the 61,065 test scores. Both Setting B models split on all 21 features.

**Robustness.** Results vary little across random seeds (Table 6.6). The standard deviation of ROC-AUC is below 0.01 in both settings. Recall and F1 vary somewhat more in Setting B, where the seed also changes the anomaly sample. The seed-42 run used in Tables 6.4 and 6.5 lies within one to two standard deviations of the mean on every measure. Its Setting B F1 (0.381) sits above the five-seed mean of 0.341.

Table 6.6: Mean ± standard deviation over five seeds (0, 1, 2, 3, 42).

| Setting (pool) | Recall | F1 | ROC-AUC |
|---|---|---|---|
| A (full test set) | 0.805 ± 0.019 | 0.680 ± 0.008 | 0.808 ± 0.004 |
| B (5% pool) | 0.829 ± 0.029 | 0.341 ± 0.030 | 0.926 ± 0.007 |

**Ablation.** Removing the five signature-like features from Setting A leaves the results almost unchanged: recall 0.799, F1 0.685, ROC-AUC 0.811, compared with 0.829, 0.672 and 0.804 with all features. Section 6.5 explains why.

## 6.5 Discussion

These results illustrate four properties of Isolation Forest and of anomaly detection on web traffic more generally. They come from one model on one synthetic dataset, so we present them as examples of the points made in Sections 2 and 3, not as general findings.

**1. A feature Isolation Forest never saw vary cannot help it.** The most instructive observation is that the novelty-detection model (Setting A) ignores six features, including most of the attack signatures we wrote. Isolation Forest chooses each split value between a feature's minimum and maximum in the training subsample. A feature that is always zero in normal training traffic therefore offers no split, and a request where that feature is non-zero gets the same path length as if it were zero. This explains the ablation result. Four of the five signature features were already unused in Setting A, so removing them changes almost nothing; the small change comes from `sql_keyword_count`, which is the only one that varies in training. When the same features appear in the fitting data, as in Setting B, the model uses all of them, and its ranking improves (ROC-AUC 0.930 vs 0.800 on the same pool). Liu et al. found only small differences between training on normal data and training on data with anomalies (Table 5.3) [Liu2012]; the large gap here comes from the features that never vary in normal traffic. This qualifies the observation by Liu et al. that Isolation Forest still works when its training sample contains no anomalies [Liu2012]: it does, but only along features that vary in normal data. The practical lesson for the semi-supervised setting of Section 2.3 is that a signal which never occurs in normal traffic needs a different kind of detector. Possible options are a rule, a model that compares new values against the training range, or a supervised component trained on labelled attacks. A model fitted on normal data alone cannot pick it up.

**2. Isolation Forest assumes anomalies are few.** Liu et al. [Liu2012] describe two failure modes when anomalies are numerous or clustered: *swamping*, where normal points are mistaken for anomalies, and *masking*, where a large group of anomalies hides its own members. Setting B on the 41% test set illustrates masking. There, attacks make up a large share of every 256-request subsample. The anomalous file is also highly repetitive (only 15,954 of its 25,065 requests are unique), so many attacks form dense groups of identical points. A dense group takes many splits to isolate, so its members would be expected to receive ordinary-looking scores. This is consistent with what we observe: only the most extreme 27% of anomalies cross the default threshold. (We did not inspect individual trees to confirm this mechanism.) This is why the 5% pool is the more appropriate unsupervised setting for this model, and it shows why the anomaly rate in the data, discussed in Section 2 as an assumption of unsupervised methods, matters in practice.

**3. The default threshold is the weak point, and the metric choice shows it.** In Setting A the default threshold flags 44% of normal requests. A false-positive rate like that would be unworkable in deployment, even though the ranking is moderately good (ROC-AUC 0.804). One plausible explanation is the training data itself: 20,000 of the 36,000 training requests are repeats of 20 parameter-free page visits. These requests make up a large share of every 256-request subsample, so normal requests that do carry parameters look comparatively rare. We have not tested this explanation. Without a labelled validation set, we did not move the threshold, so the threshold-free measures (ROC-AUC and AP) are the fairer summary of what the model has learned. This also shows why Section 5 and this case study lead with recall, F1 and threshold-free measures rather than accuracy. On the 5% pool, the Setting A model has 0.570 accuracy, below the 0.950 a model would get by flagging nothing, yet it catches 82% of attacks. Accuracy alone would rank these two models the wrong way round.
<!-- If the de-duplication check is run before the draft, replace the explanation above with its result. -->

**4. Feature engineering carries much of the weight.** Raw HTTP requests are text, so every result above depends on the 21 features we designed. Some of them use knowledge of this particular application: the parameter vocabulary and the double-encoded CRLF check. The `unseen_param_names` feature alone fires on 7,159 anomalous requests (28.6%) and on no normal ones, because it catches tampering that leaves every value normal. The deep-learning approaches surveyed in Section 4 aim to learn representations directly from the request text, using character-level models, embeddings or autoencoders [Landauer2023]. Deep Isolation Forest [Xu2023] combines the two ideas, applying isolation to representations learned by neural networks. That could reduce the reliance on hand-designed, application-specific features, but at the cost of interpretability and with more need for data. We did not run such a model, so this comparison rests on the literature rather than on our results.

**Summary.** This case study illustrates the trade-off between the semi-supervised and unsupervised settings described in Section 2.3:

- **Training on normal data only** needs no attack samples and generalises to new traffic, but it is blind to features that never vary in normal traffic, and its default threshold is poorly calibrated here.
- **Fitting on unlabelled mixed traffic** uses every feature and ranks anomalies better, but only when anomalies are genuinely rare.

The limitations of this case study are discussed in Section 7.
