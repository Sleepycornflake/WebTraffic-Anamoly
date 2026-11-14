# 2. Background and Taxonomy

<!-- DRAFT v1, Nov 14. Every claim is traced to a source in the comment after its paragraph.
Citation keys (all from Member 1's list, see paper/references.md):
  [Jha2022] [Landauer2023] [Ali2020] [Liu2012] [He2021]
[Ali2020] is cited only for its scope: its full text sits behind a login, so it was not read in full.
If Member 1 has the PDF, check that it supports the sentence it is attached to. -->

## 2.1 Anomaly detection for web and API traffic

Web servers and APIs receive a continuous stream of HTTP requests, and attacks on them arrive inside that same stream: injected SQL or script code in a parameter, requests for hidden files, tampered parameter names. The traditional defence is signature-based detection, in which analysts write rules or keyword patterns for known attacks and requests are matched against them. Its weakness is that it can only recognise what someone has already described. New or modified attacks pass unnoticed, and writing the rules takes manual effort [Jha2022].

Anomaly-based detection takes the opposite approach. Instead of describing attacks, it builds a model of normal behaviour and treats departures from that model as potentially malicious [Jha2022]. This makes it possible, in principle, to detect attacks no one has seen before, at the price of false alarms whenever legitimate traffic is merely unusual. Machine learning is the natural tool for building such models, and both classical and deep-learning methods have been applied to network traffic [Ali2020] and to server and application logs [Landauer2023, He2021].
<!-- Jha2022 intro: conventional detection relies on keyword search and rule matching, needs manual feature
removal, cannot detect unidentified attacks; anomaly detection treats departures from established patterns
as potentially dangerous. Ali2020: review of ML for anomaly detection in network traffic (title/abstract).
Landauer2023 and He2021: surveys of log anomaly detection (titles, scope). -->

## 2.2 What counts as an anomaly

The surveyed literature distinguishes several kinds of anomaly. Landauer et al. [Landauer2023] group them into four types:

- **Outliers:** single events that do not fit the rest of the data, for example a request with unusual parameter values.
- **Sequential anomalies:** events that are individually normal but occur in an unusual order.
- **Frequency anomalies:** events that occur unusually often or rarely.
- **Statistical anomalies:** deviations in aggregate properties of the data.

Most of the classical methods in Section 3 treat each data point independently and therefore target outliers. Sequential and frequency anomalies need models that see a session or a sequence of events, which is where the recurrent and attention-based models of Section 4 come in. The case study in Section 6 works at the level of single requests, so it addresses outliers only.
<!-- Landauer2023 §2.1.3 / §4.4.1 anomaly types AD-1: Outlier, Sequential, Frequency, Statistical; outliers
are "single log events that do not fit to the overall structure", detected by unusual parameter values etc. -->

## 2.3 Learning settings: supervised, semi-supervised, unsupervised

Methods differ above all in what labelled data they need. Following the usual division [Jha2022, Landauer2023], we distinguish three settings.

**Supervised.** The model is trained on examples labelled as normal or anomalous and learns to classify new inputs [Jha2022]. Where labels are available, supervised methods tend to detect better [Landauer2023]. In practice, labels are the problem: attacks change constantly, so labelled attack data is hard to collect [Jha2022], and a supervised model can only recognise the kinds of attack present in its training data.

**Semi-supervised (novelty detection).** The model is trained only on data known to be normal, and anything that differs from it is flagged. This needs no attack examples, only a clean sample of normal traffic. It is the most common setting in the deep-learning literature on logs: Landauer et al. find 28 semi-supervised approaches among the 62 they review, against 8 fully unsupervised ones, because most neural network architectures can be trained this way [Landauer2023].

**Unsupervised.** The model receives unlabelled data that may already contain anomalies, and it must separate them without any labels [Jha2022]. This is the most convenient setting, since raw traffic can be used as is, but it rests on an assumption that the data must satisfy: anomalies are rare and different from normal points. Isolation Forest states this assumption explicitly [Liu2012], and Section 6 shows what happens when it is violated.

Labels are used only for evaluation in both the semi-supervised and the unsupervised setting. The case study in Section 6 runs the same model in both settings, as Setting A (semi-supervised) and Setting B (unsupervised).
<!-- Jha2022: "supervised detection ... and unsupervised detection"; supervised requires labelled normal and
abnormal data, unsupervised needs no labels; ever-changing attacks make anomaly data hard to gather.
Landauer2023 §2.2: labels scarce, which "restricts applications to semi- and unsupervised deep learning
systems, which are known to achieve lower detection performance than supervised approaches"; §5: 28 semi-
supervised vs 8 unsupervised of 62. Liu2012: "we assume that anomalies are 'few' and 'different'". -->

## 2.4 Evaluation challenges

Two properties of the data make evaluation difficult. First, anomalies are rare, so accuracy is a poor measure: a detector that flags nothing scores highly on a mostly normal test set while catching no attacks. Measures that focus on the anomalous class, such as recall, precision and F1, or threshold-free measures such as the area under the ROC curve, describe a detector better. Liu et al., for example, evaluate Isolation Forest by AUC [Liu2012].

Second, good public datasets are scarce. Jha and Nisha found that only 29.55% of the experimental results in the studies they reviewed were based on publicly available datasets, and that about half of those datasets have been heavily criticised [Jha2022]. Results from private data cannot be reproduced or compared, which limits how far published comparisons, including the one in Section 5, can be trusted.
<!-- Jha2022 conclusion: 29.55% figure and "approximately half of these being heavily criticised by the
scientific community". Liu2012 reports AUC throughout. The accuracy point is a general one, illustrated
with our own numbers in Section 6.3. -->
