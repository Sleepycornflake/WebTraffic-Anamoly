# CONTEXT.md: Anomaly Detection Overview Paper

Paste this at the start of any new Claude chat (or give it to a teammate's agent). Last updated: Fri Oct 30, 2026.

---

## 1. What the paper is

- Course paper for AIML coursework, topic: **ML-based anomaly detection for web/API traffic**.
- The course said to write an **overview (survey) paper, not an original research paper.**
- Structure: survey of existing approaches (statistical, traditional ML, deep learning) + **one small illustrative case study** (Isolation Forest on CSIC 2010).
- The case study is a worked example that illustrates the surveyed methods. It is **not** a benchmark and must not claim to find the "best" model.
- Autoencoder is **optional**, only if everything else is done early.
- Citations: **Mendeley** (course requirement), shared private group. Agree on one style (e.g. IEEE).

### Paper outline
1. Introduction
2. Background / taxonomy (supervised, unsupervised, semi-supervised)
3. Traditional ML approaches (Isolation Forest, One-Class SVM, LOF)
4. Deep learning approaches (Autoencoders, LSTM-based, embeddings)
5. Comparative discussion (table built from published papers, not our own results)
6. Case study (illustrative, scaled down)
7. Open challenges / future directions
8. Conclusion

---

## 2. Roles

> **Revised Nov 14:** the team re-split work across subjects. **Member 1** chose the sources (six links, see §4) and does the final review: citation check, consistency check, plagiarism check. **Member 2 (me)** writes the whole paper (Sections 1-8), the code and case study, the Word/IEEE formatting, and submits it. The table below is the original split, kept for the record. The real split goes into the paper's "Author contributions" paragraph.

### Original split (Oct)

| | Owner | Tasks |
|---|---|---|
| **Member 1: Literature survey** | Teammate | Read 2-3 survey papers; study Isolation Forest, One-Class SVM, LOF, Autoencoders, LSTM methods; build comparison table from published research; draft introduction, background, taxonomy. Deliverable: paper summaries, comparison table, draft sections. |
| **Member 2: Dataset and case study** | **Me** | Download and inspect raw CSIC 2010; convert HTTP requests to features; verify labels; run Isolation Forest in Google Colab; evaluation metrics and plots; draft case study and limitations. Deliverable: working notebook, prepared dataset, plots, case-study draft. |

### My plan (Member 2), in order
1. Download the three raw CSIC 2010 files; check counts against the official page.
2. Parse raw HTTP requests into features (method, URL length, number of params, param value lengths, special-character counts, digit/letter ratios, suspicious keyword flags). **Document every feature and why it was chosen** (this is the case study's methodology).
3. Verify labels: training set is normal-only; label the two test sets (0 normal, 1 anomalous); check for duplicate requests across normal and anomalous sets and log the count (goes in limitations).
4. Isolation Forest in Colab: fit on normal training data only, score the combined test sets, fixed random seed, record hyperparameters.
5. Evaluate: confusion matrix, ROC-AUC, precision/recall/F1, anomaly score histogram. Lead with recall/F1, not accuracy.
6. Draft case study and limitations. Limitations to cover: synthetic traffic from one e-commerce app, label noise, hand-picked features, no tuning rigor.

### Timeline (revised Oct 30: first draft within 1.5 weeks; day-by-day in PLAN.md)
- Steps 1-3: by Sat Oct 31 (feature list frozen)
- Steps 4-5: by Tue Nov 3
- Step 6: drafted Nov 4-7, merged with Member 1's sections Nov 7
- **First complete draft: Tue Nov 10**
- Sunday syncs Nov 1 and Nov 8: bring whatever exists, flag blockers by Wed Nov 4

### What I need from Member 1
- Her taxonomy and section numbers for traditional ML and deep learning (so the case study cites them correctly)
- Which Mendeley group/folder to use
- Confirmation she cites the dataset as below

---

## 3. Dataset facts: HTTP DATASET CSIC 2010

- Source: Information Security Institute of CSIC (Spanish Research National Council). Authors: **Torrano-Giménez, C., Pérez-Villegas, A., Álvarez Marañón, G.** (cite in this name order; the official page was last updated Jan 2012).
- Synthetic traffic generated against an e-commerce web application (Spanish-language, so some Latin characters).
- Official counts: **36,000 normal** and **25,000+ anomalous** requests. Verify counts after loading, since mirrors may differ.
- Attack types: SQL injection, buffer overflow, information gathering, file disclosure, CRLF injection, XSS, server-side include, parameter tampering.
- Anomalous request types: static attacks (hidden/non-existent resources), dynamic attacks (modified arguments), unintentional illegal requests (malformed but not malicious).
- **Official split:** one training set (normal traffic only) + two test sets (normal; anomalous). This fits Isolation Forest trained on normal data only.
- Use the **raw** version, not a cleaned Kaggle version, so feature engineering is part of the methodology. Mirrors seen: GitHub `Kiinitix/HTTP-CSIC-2010`, GitHub `msudol/Web-Application-Attack-Datasets`.
- The original official host link is unreliable; always cite the original authors, not the mirror.

---

## 4. Sources

**Nov 14: Member 1's source list** (six links) is the citation base; all four DOIs were checked on Crossref and both PDFs load. Full IEEE-style entries are in `paper/references.md`. Corrections to the lists below:
- Landauer et al. 2023 has **four** authors: Landauer, Onder, Skopik, Wurzenberger.
- 10.1145/3460345 = He, He, Chen, Yang, Su, Lyu (2021), "A Survey on Automated Log Analysis for Reliability Engineering," *ACM Computing Surveys* 54(6). Now usable.
- 10.1109/ICRITO48877.2020.9197818 = Yadav, Kumar, Dhavale (2020), "A Survey on Log Anomaly Detection using Deep Learning," ICRITO 2020, pp. 1215-1220. Now usable.
- Liu et al. (Isolation Forest) and Pang et al. are **not** on her list: proposed additions, need her OK.

### Verified (opened and confirmed)
- Ali, W. A., Manasa K. N., Aljunid, M., Bendechache, M., & Sandhya, P. (2020). A Review of Current Machine Learning Approaches for Anomaly Detection in Network Traffic. *Journal of Telecommunications and the Digital Economy*, 8(4), 64-95. doi:10.18080/jtde.v8n4.307 (structural template for the survey)
- Jha, B. K., & Nisha (2022). Anomaly Detection for Web Log Data Analysis: A Review. *IJSDR*, 7(6). (Secondary source: cite its survey content, not its own proposed system. Its conclusion says only 29.55% of reviewed results use public datasets, which supports the open-challenges section.)
- Torrano-Giménez et al. HTTP DATASET CSIC 2010 description PDF (dataset citation)
- Landauer, Skopik & Wurzenberger (2023). Deep learning for anomaly detection in log data: A survey. *Machine Learning with Applications*, 12, 100470. (Title and venue confirmed via another paper's reference list; **verify author names on the publisher page before citing.**)

### Core papers (cite as planned)
- Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). Isolation Forest. *ICDM 2008*, 413-422.
- Liu, F. T., Ting, K. M., & Zhou, Z. H. (2012). Isolation-based Anomaly Detection. *ACM TKDD*, 6(1).
- Pang, G., Shen, C., Cao, L., & van den Hengel, A. (2021). Deep Learning for Anomaly Detection: A Review. *ACM Computing Surveys*, 54(2).

### Unverified: do not cite until opened in a browser
- ACM DOI 10.1145/3460345 (site blocked automated access)
- IEEE ICRITO DOI 10.1109/ICRITO48877.2020.9197818 (page would not load; could not identify the paper)

---

## 5. Working rules

- Fixed random seeds and documented hyperparameters; results must be reproducible.
- Frame all results as "illustrates the methods in Section 3/4", never "we found the best method".
- Code lives in the GitHub repo (`/data`, `/notebooks`, `/paper`); chats are for help, not storage.
- Two Claude accounts do not share memory. This file is the source of truth. Update section 6 at the end of every work session.

---

## 6. Where I am now (update this each session)

- **Update Sat Nov 14, 2026:**
  - Case study 6.1-6.5 drafted and pushed (Nov 7); limitations blanks filled.
  - Roles re-split (see §2). Member 1's six sources verified and recorded in `paper/references.md`.
  - New target: complete paper **Mon Nov 16**, in the IEEE conference template, then submit to any venue (the course only needs proof of submission).
  - Next: get Member 1's OK to add Liu et al. 2008; draft Sections 2-3, then 4-5, 1, 7, 8; build the Word document; Member 1 reviews; submit.

### Earlier log

- **Date:** Fri Oct 30, 2026
- **Done so far:** Repo set up (`/data`, `/notebooks`, `/src`, `/paper`, `/results`). Scripts written: download (msudol mirror, raw files), parser, 21 documented features, dataset builder with count/duplicate report. Notebooks 01 (data) and 02 (Isolation Forest, seed check, no-signature ablation) ready for Colab. Paper section scaffolds and reference checklist in `/paper`.
- **Also done:** downloaded the raw files (checksums in `data/README.md`) and built `data/processed/csic2010_features.csv`. Counts: 36,000 / 36,000 / 25,065, 0 parse failures.
- **Currently working on:** Plan step 3 (verify data, freeze features).
- **Blockers / odd findings (counts, parse failures, duplicates):**
  - Training has only 9,644 unique requests out of 36,000, because the generator repeats 20 static pages 1,000x each.
  - 397 PUT requests, all in the anomalous set.
  - 0 identical requests shared between the normal and anomalous test sets.
  - Common anomalies only rename a parameter (`id` → `idA`). Added `unseen_param_names` (vocabulary of 20 names from training only). It fires on 7,159 anomalous (28.6%) and 0 normal requests.
  - Fixed `crlf_flag`: this dataset's CRLF attacks are double-encoded (`%250D%250A`). It now fires on 932 anomalous and 0 normal requests.
  - **Key finding:** 6 features are always 0 in normal training traffic: `nonstandard_extension`, `unseen_param_names`, `xss_keyword_count`, `path_traversal_flag`, `ssi_cmd_flag`, `crlf_flag`.
    - Checked with sklearn 1.7.2: when IF is fitted on normal-only data, it never splits on them. Zeroing them changes 0 of 61,065 test scores.
    - Cause: IF can only isolate along dimensions that vary in its training data. This goes in Discussion.
  - `sql_keyword_count` fires on 4 normal training requests (ordinary registration forms), so it is not constant.
  - Duplicates are compared on method+path+query+body, ignoring headers (Cookie has a random JSESSIONID per request).
- **Case study design changed (Oct 30):** notebook 02 now runs two settings.
  - **A, semi-supervised/novelty:** fit on normal training data only.
  - **B, unsupervised:** fit on an unlabelled pool, either all normal test requests plus a seeded 5% sample of anomalies, or the full 41%-anomalous test set.
  - This maps onto the Section 2 taxonomy.
- **First results** (local run, Anaconda Python 3.13.9, sklearn 1.7.2, seed 42; full numbers in `results/metrics/isolation_forest_run.json`). These are illustrative, not a benchmark:
  - **A on the full test set:** recall 0.829, precision 0.565, F1 0.672, ROC-AUC 0.804. The default threshold flags 15,966 of 36,000 normal requests (44%).
  - **Same 5% pool:** A has ROC-AUC 0.800 and F1 0.161; B has ROC-AUC 0.930 and F1 0.381. B splits on all 21 features; A never uses the 6 constant ones.
  - **B on the 41% pool:** precision 1.000 but recall 0.274, ROC-AUC 0.908. When anomalies are not "few", only the most extreme get isolated (masking; Liu et al.).
  - **Seed spread (5 seeds):** ROC-AUC 0.808 ± 0.004 (A) and 0.926 ± 0.007 (B, 5%).
  - **No-signature-features run in A:** ROC-AUC 0.811, essentially unchanged, as predicted.
  - **Hypothesis for A's false positives (unverified):** the 20,000 repeated parameter-free page visits dominate each tree's 256-request sample, so normal requests with parameters look rare.
- **Next 3 actions:** confirm the exact anomalous count on the official page; push the repo to GitHub, set `REPO_URL`, and re-run notebook 02 in Colab (check the numbers match); raise the design change and the taxonomy link with Member 1 at Sunday's sync.
- **Questions for Claude / teammate:** Teammate: taxonomy + section numbers, Mendeley group, IEEE style OK?, where the merged draft lives.
