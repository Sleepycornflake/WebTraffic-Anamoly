# 6. Case Study: Isolation Forest on HTTP DATASET CSIC 2010

> Framing for every paragraph: this section *illustrates* the unsupervised, normal-only training setting described in Section 2 and the Isolation Forest method described in Section 3.x. It is not a benchmark and makes no claim that Isolation Forest is the best method.

## 6.1 Dataset

<!-- What it is, who made it (cite Torrano-Giménez et al.), synthetic e-commerce traffic, attack types,
the official split (normal-only training; normal and anomalous test sets). Final verified counts from
data/README.md. Mention: raw version used, so feature engineering is part of the method. -->

## 6.2 From raw HTTP requests to features

<!-- Parsing: request line + headers + body; headers excluded and why (constant across the dataset,
random JSESSIONID). Payload = decoded query + body. Then the feature table below.
Regenerate the table with: python src/features.py --markdown -->

Table 6.1: Features extracted from each request.

<!-- paste table here -->

## 6.3 Experimental setup

<!-- Two settings, each tied to the Section 2 taxonomy:
  A (semi-supervised / novelty): fit on normal training traffic only.
  B (unsupervised): fit on an unlabelled pool containing attacks; main pool = all normal test + seeded 5%
  anomalous sample (IF assumes anomalies are few), full 41% test set as a contrast. Labels only for evaluation.
  B fits and scores the same pool (transductive); say so.
Setting A details: fit on normal training traffic only (matches the semi-supervised/novelty-detection setting).
Hyperparameters: n_estimators=100, max_samples=256 (Liu et al. 2008 defaults), contamination='auto',
random_state=42. No tuning on the test set. Metrics: recall, precision, F1 at the default threshold;
ROC-AUC and average precision as threshold-free measures; accuracy reported last and why
(class balance of the test set). Environment: Google Colab, versions from isolation_forest_run.json. -->

## 6.4 Results

<!-- Table 6.2 from results/metrics/isolation_forest_run.json. Figures:
results/figures/if_confusion_matrix.png, if_roc_curve.png, if_score_histogram.png, if_roc_settings.png
(A vs B on the same 5% pool). Table 6.3: settings comparison (settings_comparison in the JSON).
Compare precision only between rows on the same pool; ROC-AUC is base-rate independent.
Seed sensitivity: mean ± std over 5 seeds. Descriptive language only. -->

## 6.5 Discussion

<!-- Link each observation back to a property of Isolation Forest from Section 3
(e.g. isolates points that are few and different; struggles when anomalies look like normal traffic
in feature space). What the no-signature-feature run says about hand-crafted features.
How a deep model from Section 4 might differ (without running one).
Key point (verified Oct 30): 6 of 21 features are always 0 in normal training traffic, so IF fitted on
normal-only data never splits on them. IF isolates points only along dimensions that vary in its
training sample; rare categorical signals are invisible to it in the novelty setting. -->

<!-- Source text for this observation (from CONTEXT.md §6): "Zeroing them changes 0 of 61,065 test scores." -->
