# Plan to first draft: Fri Oct 30 → Tue Nov 10, 2026

Target: **complete first draft of the case study + limitations by Tue Nov 10**, merged with Member 1's sections. Weekly Sunday syncs fall on **Nov 1** and **Nov 8**; flag blockers by **Wed Nov 4**.

Tick boxes as you go and copy anything surprising into CONTEXT.md §6.

## Week 1: data and model

### Fri Oct 30: setup + data (plan steps 1-2)
- [x] Workspace, repo, scripts, notebooks
- [x] `python src/download.py`; record sizes and SHA-256 in `data/README.md`
- [x] `python src/build_dataset.py`; record parsed counts vs official counts (36,000 / 36,000 / 25,065, 0 parse failures)
- [ ] Open the official dataset page/PDF and confirm the exact official counts per file

### Sat Oct 31: verify data (plan step 3)
- [ ] Read `results/metrics/data_report.json`: parse failures, duplicates within files, duplicates normal ↔ anomalous
- [ ] Look at 10-20 anomalous requests by eye in `data/processed/csic2010_requests.csv`; do the features capture them?
- [ ] Freeze the feature list (any change after this date means re-running everything)
- [ ] Start `paper/sections/06_case_study.md` §6.1 Dataset and §6.2 Features (the feature table is generated: `python src/features.py --markdown`)

### Sun Nov 1: sync with Member 1
- [ ] Get her taxonomy and section numbers for traditional ML (Sec 3) and deep learning (Sec 4)
- [ ] Agree Mendeley group/folder and citation style (proposal: IEEE)
- [ ] Confirm the dataset citation (author order: Torrano-Giménez, Pérez-Villegas, Álvarez Marañón)
- [ ] Agree where the merged draft lives (Word or Google Docs with the Mendeley Cite plugin)

### Mon Nov 2: Isolation Forest (plan step 4)
- [x] (Done early, Oct 30) Notebook 02 run locally end to end: Setting A (normal-only) + Setting B (unsupervised). First numbers in CONTEXT.md §6
- [ ] Push repo to GitHub, set `REPO_URL` in both notebooks
- [ ] Re-run `02_isolation_forest.ipynb` in Colab; check the numbers match the local run (small sklearn-version differences are possible; if so, report the Colab run)
- [ ] Commit `results/figures/*.png` and `results/metrics/isolation_forest_run.json`

### Tue Nov 3: evaluation (plan step 5)
- [x] Seed-sensitivity tables (A: ROC-AUC ± 0.004, B: ± 0.007, so the spread is small)
- [x] No-signature-features run (no real change in A, as predicted)
- [ ] Check the false-positive hypothesis: re-fit A on de-duplicated training data and see if the 44% false-positive rate drops (one extra cell; an observation for Discussion, not tuning)
- [ ] Write 3-5 bullet observations, each tied to a property of IF described in Sec 3 (candidates: constant features unused in A; masking at 41% anomalies in B; default threshold poorly calibrated in A)

### Wed Nov 4: blocker deadline
- [ ] Anything blocking? Tell Member 1 today
- [ ] Draft §6.3 Experimental setup (split, hyperparameters, seed, metrics and why recall/F1 first)

## Week 2: writing

### Thu Nov 5
- [ ] Draft §6.4 Results (table + 2-3 figures, descriptive language only)
- [ ] Decision point: ahead of schedule? If yes, and only then, consider the optional autoencoder

### Fri Nov 6
- [ ] Draft §6.5 Discussion (link observations back to Sec 3/4 and the comparison table in Sec 5)
- [ ] Draft limitations (`paper/sections/07_limitations.md` or merged into Sec 7)

### Sat Nov 7
- [ ] Insert citations via Mendeley; check every claim has a source
- [ ] Merge sections with Member 1's draft

### Sun Nov 8: sync
- [ ] Read the whole merged draft together; list fixes

### Mon Nov 9
- [ ] Apply fixes; re-check figures/tables match `isolation_forest_run.json`

### Tue Nov 10: first draft done
- [ ] Buffer day; final read-through; update CONTEXT.md §6
