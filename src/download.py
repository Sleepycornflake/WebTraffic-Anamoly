"""Download the three raw HTTP DATASET CSIC 2010 files into data/raw/.

Source mirror: github.com/msudol/Web-Application-Attack-Datasets (OriginalDataSets/csic_2010).
The mirror is only where we fetch the files from. In the paper, always cite the
original authors: Torrano-Gimenez, C., Perez-Villegas, A., Alvarez Maranon, G.

Usage (from the repo root, locally or in Colab):
    python src/download.py            # skips files that already exist
    python src/download.py --force    # re-download

After downloading, the script prints each file's size and SHA-256 so they can be
recorded in data/README.md (reproducibility: anyone can check they have the same bytes).
"""

import argparse
import hashlib
import socket
import sys
import time
import urllib.request
from pathlib import Path

MIRROR = (
    "https://raw.githubusercontent.com/msudol/Web-Application-Attack-Datasets/"
    "master/OriginalDataSets/csic_2010/"
)
FILES = [
    "normalTrafficTraining.txt",
    "normalTrafficTest.txt",
    "anomalousTrafficTest.txt",
]
RETRIES = 4
RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--force", action="store_true", help="re-download existing files")
    args = parser.parse_args()

    socket.setdefaulttimeout(60)   # a stalled connection raises and is retried instead of hanging
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        dest = RAW_DIR / name
        if dest.exists() and not args.force:
            print(f"[skip] {name} already exists")
        else:
            print(f"[get ] {MIRROR + name}")
            tmp = dest.with_suffix(".part")
            for attempt in range(1, RETRIES + 1):
                try:
                    urllib.request.urlretrieve(MIRROR + name, tmp)
                    break
                except OSError as exc:
                    print(f"       attempt {attempt}/{RETRIES} failed: {exc}")
                    if attempt == RETRIES:
                        raise
                    time.sleep(3 * attempt)
            tmp.replace(dest)
        print(f"       {dest.stat().st_size:>12,} bytes  sha256={sha256(dest)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
