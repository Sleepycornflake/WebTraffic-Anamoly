# Limitations of the case study (feeds Section 7)

Fill each bullet with a concrete number or observation from `results/metrics/`.

- **Synthetic traffic from a single application.** CSIC 2010 was generated against one Spanish e-commerce site; real traffic is more varied, so results do not transfer directly. Links to Jha & Nisha (2022): only 29.55% of reviewed results use public datasets.
- **Label noise / overlapping requests.** Number of identical requests found in both the normal and anomalous test sets: 0 (from `data_report.json`), so labels do not contradict each other at the request level. Repetition is the bigger issue: only 9,644 of 36,000 training requests are unique, so metrics are weighted towards a few repeated requests. Some "anomalous" requests are unintentional malformed requests rather than attacks.
- **Hand-picked features.** Features were designed by looking at this dataset; several keyword features are effectively attack signatures. Difference with vs without them in Setting A: ROC-AUC 0.804 vs 0.811, F1 0.672 vs 0.685 (ablation cell in notebook 02), i.e. no real change, because four of the five are constant in training and never used.
- **Closed parameter vocabulary.** `unseen_param_names` works because this synthetic shop has a fixed set of 20 parameter names. A real API adds parameters with each release, so the feature would raise false alarms unless the vocabulary is refreshed.
- **Novelty setting ignores features that never vary in normal traffic.** Six features (including all signature-like flags except SQL keywords) are always 0 in training, and Isolation Forest fitted on normal-only data never splits on them (verified: zeroing them changes 0 of 61,065 test scores).
- **Setting B is transductive.** The unsupervised model is fitted and scored on the same pool, and the 5% pool is an artificial mix we constructed; real anomaly rates are unknown.
- **Default threshold in Setting A.** `contamination="auto"` flags 44% of normal test requests; without a validation set we did not recalibrate it, so threshold-free metrics (ROC-AUC, AP) are the fairer summary.
- **No tuning rigour.** Library-default hyperparameters, no validation split for threshold selection; only seed sensitivity checked.
- **Age of the dataset.** Published 2010 (page updated 2012); modern APIs (JSON bodies, GraphQL, auth tokens) are not represented.
- **Request-level only.** Each request is scored independently; no session or sequence context (which the LSTM methods in Section 4 address).
