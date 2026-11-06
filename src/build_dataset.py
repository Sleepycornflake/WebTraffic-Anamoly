"""Raw CSIC 2010 files -> labelled feature table + a data-quality report.

Usage (from the repo root):
    python src/build_dataset.py

Writes:
    data/processed/csic2010_features.csv   one row per request: ids, split, label, features
    data/processed/csic2010_requests.csv   the same rows with method/url/body, for inspection
    results/metrics/data_report.json       counts, parse failures, duplicate counts
    results/metrics/param_vocabulary.json  parameter names seen in training (for unseen_param_names)

Labels: 0 = normal, 1 = anomalous. The training split is normal-only (official
split), which is what Isolation Forest is fitted on.
"""

import csv
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import FEATURE_NAMES, extract, param_vocabulary  # noqa: E402
from parse import parse_file  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"
REPORT = ROOT / "results" / "metrics" / "data_report.json"
VOCAB = ROOT / "results" / "metrics" / "param_vocabulary.json"

# file -> (split, label). Expected counts are from the official dataset page as
# summarised in CONTEXT.md; re-check them against the page before quoting in the paper.
SOURCES = {
    "normalTrafficTraining.txt": ("train", 0),
    "normalTrafficTest.txt": ("test", 0),
    "anomalousTrafficTest.txt": ("test", 1),
}
EXPECTED = {
    "normalTrafficTraining.txt": 36000,
    "normalTrafficTest.txt": 36000,
    "anomalousTrafficTest.txt": None,   # official page says "25,000+"; record the exact number we get
}


def main() -> int:
    missing = [f for f in SOURCES if not (RAW / f).exists()]
    if missing:
        print(f"Missing raw files in {RAW}: {missing}\nRun: python src/download.py")
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)

    report = {"files": {}, "duplicates": {}}
    keys = {}   # file -> Counter of dedup keys
    id_cols = ["request_id", "source_file", "split", "label"]

    parsed = {fname: parse_file(RAW / fname) for fname in SOURCES}
    # Parameter-name vocabulary from the training split only (no test data leaks in).
    vocab = param_vocabulary(r for f, (split, _) in SOURCES.items() if split == "train"
                             for r in parsed[f].requests)
    VOCAB.write_text(json.dumps(sorted(vocab), indent=1, ensure_ascii=False), encoding="utf-8")
    report["param_vocabulary_size"] = len(vocab)

    with open(OUT / "csic2010_features.csv", "w", newline="", encoding="utf-8") as ff, \
         open(OUT / "csic2010_requests.csv", "w", newline="", encoding="utf-8") as fr:
        fw = csv.DictWriter(ff, fieldnames=id_cols + FEATURE_NAMES)
        rw = csv.DictWriter(fr, fieldnames=id_cols + ["method", "url", "body"])
        fw.writeheader()
        rw.writeheader()

        for fname, (split, label) in SOURCES.items():
            result = parsed[fname]
            keys[fname] = Counter(r.dedup_key for r in result.requests)
            methods = Counter(r.method for r in result.requests)
            report["files"][fname] = {
                "split": split,
                "label": label,
                "parsed_requests": len(result.requests),
                "expected": EXPECTED[fname],
                "matches_expected": None if EXPECTED[fname] is None else len(result.requests) == EXPECTED[fname],
                "methods": dict(methods),
                "parse_failures": len(result.failures),
                "parse_failure_examples": result.failures[:10],
                "duplicates_within_file": sum(c - 1 for c in keys[fname].values() if c > 1),
            }
            stem = Path(fname).stem
            for i, req in enumerate(result.requests):
                ids = {"request_id": f"{stem}-{i:05d}", "source_file": fname, "split": split, "label": label}
                fw.writerow({**ids, **extract(req, vocab)})
                rw.writerow({**ids, "method": req.method, "url": req.url, "body": req.body})

    tr, nt, an = (set(keys[f]) for f in SOURCES)
    report["duplicates"] = {
        "_note": "Unique request contents (method+path+query+body, headers ignored) shared between files.",
        "normal_test_and_anomalous_test": len(nt & an),
        "train_and_anomalous_test": len(tr & an),
        "train_and_normal_test": len(tr & nt),
    }
    report["duplicates"]["_examples_normal_and_anomalous"] = sorted(nt & an)[:5]

    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != "parse_failure_examples"}
                      for k, v in report["files"].items()}, indent=2))
    print(json.dumps({k: v for k, v in report["duplicates"].items() if not k.startswith("_ex")}, indent=2))
    print(f"\nWrote {OUT / 'csic2010_features.csv'}\nWrote {REPORT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
