# ML-based Anomaly Detection for Web/API Traffic: An Overview

AIML coursework survey paper, plus one small illustrative case study (Isolation Forest on HTTP DATASET CSIC 2010).

- **Source of truth for the project:** [CONTEXT.md](CONTEXT.md). Update section 6 at the end of every work session.
- **Day-by-day schedule to the first draft (Tue Nov 10):** [PLAN.md](PLAN.md)

## Layout

```
CONTEXT.md                 project brief, roles, dataset facts, sources, session log
PLAN.md                    schedule + checklists to the first draft
data/
  raw/                     the three raw CSIC 2010 .txt files (not committed, ~56 MB)
  processed/               feature table + request table built from raw (not committed)
  README.md                provenance, checksums, verified counts
src/
  download.py              fetch raw files from the GitHub mirror
  parse.py                 raw text -> HTTP requests
  features.py              request -> 21 numeric features, each documented (FEATURES dict)
  build_dataset.py         raw -> labelled CSVs + results/metrics/data_report.json
notebooks/
  01_inspect_and_build_dataset.ipynb   plan steps 1-3
  02_isolation_forest.ipynb            plan steps 4-5 (Setting A: normal-only, Setting B: unsupervised)
results/
  figures/                 plots for the paper (committed)
  metrics/                 data_report.json, isolation_forest_run.json (committed)
paper/
  outline.md               section plan and who owns what
  sections/                one markdown file per section (case study + limitations are Member 2's)
  references.md            working reference list (mirror of the Mendeley group)
```

## Running it

**In Google Colab (planned route):** push this repo to GitHub, set `REPO_URL` in the first cell of each notebook, then open the notebook in Colab (File → Open notebook → GitHub). The first cell clones the repo; everything else runs as is. Colab already has numpy, pandas, scikit-learn and matplotlib.

**Locally (optional):** your Anaconda install (Python 3.13, scikit-learn 1.7.2) already has everything. Both notebooks were run end to end with it on Oct 30.

```bash
~/anaconda3/python.exe src/download.py
```

```bash
~/anaconda3/python.exe src/build_dataset.py
```

```bash
~/anaconda3/python.exe -m jupyter lab
```

`download.py`, `parse.py`, `features.py` and `build_dataset.py` use only the Python standard library; the notebooks need the packages in `requirements.txt`.

## Working rules (from CONTEXT.md)

- Fixed seeds (`SEED = 42`), hyperparameters saved with every run in `results/metrics/`.
- The case study *illustrates* the methods surveyed in Sections 3-4. Never "we found the best method".
- Lead with recall/F1, not accuracy.
- Cite the dataset's original authors, never the mirror.
