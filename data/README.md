# Data: HTTP DATASET CSIC 2010

**Cite as:** Torrano-Giménez, C., Pérez-Villegas, A., Álvarez Marañón, G. *HTTP DATASET CSIC 2010.* Information Security Institute of CSIC (Spanish Research National Council). (Official page last updated Jan 2012.)

**Fetched from (mirror, do not cite):** https://github.com/msudol/Web-Application-Attack-Datasets/tree/master/OriginalDataSets/csic_2010

`data/raw/` and `data/processed/` are git-ignored. Rebuild them with `python src/download.py` then `python src/build_dataset.py`.

## Files and verification

Downloaded and built Fri Oct 30, 2026.

| File | Split | Label | Size (bytes) | SHA-256 | Official count | Parsed count | Match? |
|---|---|---|---|---|---|---|---|
| normalTrafficTraining.txt | train | 0 | 20,148,988 | `d51de812d9201ef2b173b6ae3e3e740c309047ac85545c06c51d6fb1ddbc1e63` | 36,000 | 36,000 | ✅ |
| normalTrafficTest.txt | test | 0 | 20,151,204 | `f05dfc312d5d14fd1ed8371de27a9e4deab3dc09265f5d7f9df2643df8385089` | 36,000 | 36,000 | ✅ |
| anomalousTrafficTest.txt | test | 1 | 15,734,523 | `12fa4f0d496ceb859bb2652abf7f0f0ed8c59e1d9ce501b8a9a0ef38a625c046` | 25,000+ (check exact on official page) | 25,065 | to confirm |

Methods: training and normal test are 28,000 GET + 8,000 POST each; anomalous is 15,088 GET + 9,580 POST + **397 PUT** (PUT never appears in normal traffic).

## Data-quality findings (for the limitations section)

- **Parse failures:** 0 in all three files.
- **Heavy repetition inside files** (duplicate = same method + path + query + body, headers ignored):
  - training: 36,000 requests, only 9,644 unique; normal test: 26,378 repeats; anomalous: 25,065 requests, 15,954 unique.
  - Cause: the generator requests 20 parameter-free pages exactly 1,000 times each (20,000 of the 36,000 training requests have no query or body), and replays each form both as GET and as POST.
  - Consequence: metrics are weighted towards these repeated requests; worth one sentence in limitations.
- **Identical requests in both normal and anomalous test sets:** 0. Normal train and normal test share 626 unique requests (expected, same generator).
- **Parameter-name tampering:** the most repeated anomalies only rename a parameter (`B2` → `B2A`, `errorMsg` → `errorMsgA`, `id` → `idA`) with normal values.
  - Handled by the `unseen_param_names` feature, whose vocabulary is the 20 parameter names in training (`results/metrics/param_vocabulary.json`).
  - It fires on 7,159 anomalous requests (28.6%) and 0 normal ones.
- **Double encoding:** CRLF injection payloads are double-encoded (`%250D%250A`). `crlf_flag` checks the once-decoded payload as well: 932 anomalous, 0 normal.
- **Features constant in training:** `nonstandard_extension`, `unseen_param_names`, `xss_keyword_count`, `path_traversal_flag`, `ssi_cmd_flag`, `crlf_flag` are 0 for all 36,000 training requests. See CONTEXT.md §6 for what this means for Isolation Forest.
- **Encoding:** files are Latin-1; Spanish characters are percent-encoded as Latin-1 bytes (e.g. `%F1` = ñ).
