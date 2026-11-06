"""Turn a parsed HTTP request into a fixed-length numeric feature vector.

Every feature is listed in FEATURES with a one-line definition and the reason it
was chosen. That table is the case study's methodology; paper/sections/
06_case_study.md pulls it in via `python src/features.py --markdown`.

"Payload" below means the decoded parameter names and values from the query
string and body, joined by spaces, i.e. all user-controlled input without the
'=' / '&' separators (otherwise every normal request would score high on
special characters). Headers are deliberately excluded (see Request.dedup_key).
"""

import math
import re
import sys
from collections import Counter
from urllib.parse import parse_qsl, unquote_plus

# Characters that rarely appear in normal form input but are needed by most
# injection attacks (SQL quoting/terminators, HTML tags, shell/SSI syntax).
SPECIAL_CHARS = set("'\"<>;()=-*%|&$`{}[]\\!#")

SQL_KEYWORDS = re.compile(
    r"\b(select|union|insert|update|delete|drop|from|where|or\s+1=1|and\s+1=1|exec|sleep|benchmark)\b|--|/\*",
    re.IGNORECASE,
)
XSS_KEYWORDS = re.compile(r"<\s*script|javascript:|onerror\s*=|onload\s*=|alert\s*\(|<\s*img|<\s*iframe", re.IGNORECASE)
TRAVERSAL = re.compile(r"\.\./|\.\.\\|/etc/passwd|boot\.ini|win\.ini", re.IGNORECASE)
SSI_CMD = re.compile(r"<!--\s*#\s*(exec|include|echo)|\|\s*\w+|;\s*(ls|cat|rm|wget|id)\b", re.IGNORECASE)
CRLF = re.compile(r"%0d|%0a|\r|\n", re.IGNORECASE)
PCT_ESCAPE = re.compile(r"%[0-9A-Fa-f]{2}")

# Extensions a normal user of this shop would request. Anything else (.bak, .old,
# .inc, ...) suggests probing for hidden or non-existent resources ("static attacks").
COMMON_EXTENSIONS = {"", "jsp", "html", "htm", "gif", "jpg", "jpeg", "png", "css", "js"}

# name -> (definition, why it was chosen). Order here is column order in the CSV.
FEATURES = {
    "is_post": ("1 if method is POST, else 0",
                "Attack payloads can arrive in the body instead of the URL; lets the model treat the two cases differently."),
    "path_length": ("Characters in the URL path",
                    "Static attacks request unusual or long resource paths."),
    "path_depth": ("Number of '/' segments in the path",
                   "Directory probing and traversal change path depth."),
    "nonstandard_extension": ("1 if the path's file extension is not a normal page/asset type (.jsp, .html, images, css, js)",
                              "Captures requests for hidden/backup files (static attacks). App-informed: chosen by looking at this shop's URLs."),
    "query_length": ("Characters in the raw query string",
                     "Injected payloads make the query longer."),
    "body_length": ("Characters in the raw body",
                    "Same as query_length, for POST payloads."),
    "num_params": ("Number of key=value parameters in query + body",
                   "Parameter tampering can add or drop parameters."),
    "unseen_param_names": ("Number of parameter names in the request that never occur in the normal training traffic",
                           "Catches tampering that only renames a parameter (e.g. id -> idA) and leaves values normal. "
                           "Learned from the training split only, so it stays within the normal-only setting."),
    "max_param_value_length": ("Length of the longest decoded parameter value",
                               "Buffer-overflow and injection attempts produce one very long value."),
    "mean_param_value_length": ("Mean decoded parameter value length (0 if no params)",
                                "Less sensitive to a single outlier than the max; describes the request as a whole."),
    "special_char_count": ("Count of characters from SPECIAL_CHARS in the decoded payload",
                           "SQLi, XSS and command injection all need quoting, brackets or terminators."),
    "pct_escape_count": ("Number of %XX escapes in the raw payload",
                         "Attackers percent-encode to hide characters; normal Spanish input only escapes a few accented letters."),
    "digit_ratio": ("Digits / payload length",
                    "Normal fields (price, quantity, id) are digit-heavy; injected text shifts the ratio."),
    "letter_ratio": ("Letters / payload length",
                     "Complements digit_ratio; injected keywords and scripts are letter-heavy."),
    "non_alnum_ratio": ("Non-alphanumeric, non-space characters / payload length",
                        "Normalised version of special_char_count, independent of payload size."),
    "payload_entropy": ("Shannon entropy (bits/char) of the decoded payload",
                        "Encoded or obfuscated payloads have a different character distribution than ordinary form text."),
    "sql_keyword_count": ("Matches of SQL keywords/comment markers in the decoded payload",
                          "Direct signal for SQL injection (signature-like; see limitations)."),
    "xss_keyword_count": ("Matches of script/event-handler patterns in the decoded payload",
                          "Direct signal for XSS (signature-like; see limitations)."),
    "path_traversal_flag": ("1 if '../' or a known system file name appears in path or payload",
                            "File disclosure attempts."),
    "ssi_cmd_flag": ("1 if SSI directives or shell command patterns appear in the decoded payload",
                     "Server-side include and command injection attempts."),
    "crlf_flag": ("1 if CR/LF (raw or %0d/%0a) appears in the raw or once-decoded payload",
                  "CRLF injection. Checking the decoded payload too catches the double-encoded form (%250D%250A) used in this dataset."),
}
FEATURE_NAMES = list(FEATURES)


def _decode(s: str) -> str:
    return unquote_plus(s, encoding="latin-1", errors="replace")


def _entropy(s: str) -> float:
    if not s:
        return 0.0
    n = len(s)
    return -sum(c / n * math.log2(c / n) for c in Counter(s).values())


def _params(req: "parse.Request") -> list:
    return parse_qsl(req.query, keep_blank_values=True, encoding="latin-1", errors="replace") + \
        parse_qsl(req.body, keep_blank_values=True, encoding="latin-1", errors="replace")


def param_vocabulary(train_requests) -> set:
    """Parameter names seen in the (normal-only) training requests."""
    return {name for req in train_requests for name, _ in _params(req)}


def extract(req: "parse.Request", known_param_names: set) -> dict:
    """known_param_names must come from param_vocabulary(training requests), never from test data."""
    raw_payload = "&".join(p for p in (req.query, req.body) if p)
    params = _params(req)
    payload = " ".join(f"{k} {v}" if v else k for k, v in params)
    value_lengths = [len(v) for _, v in params]
    n = len(payload) or 1   # avoid division by zero for empty payloads

    last_segment = req.path.rsplit("/", 1)[-1]
    ext = last_segment.rsplit(".", 1)[-1].lower() if "." in last_segment else ""
    decoded_path = _decode(req.path)

    return {
        "is_post": int(req.method == "POST"),
        "path_length": len(req.path),
        "path_depth": req.path.count("/"),
        "nonstandard_extension": int(ext not in COMMON_EXTENSIONS),
        "query_length": len(req.query),
        "body_length": len(req.body),
        "num_params": len(params),
        "unseen_param_names": sum(name not in known_param_names for name, _ in params),
        "max_param_value_length": max(value_lengths, default=0),
        "mean_param_value_length": sum(value_lengths) / len(value_lengths) if value_lengths else 0.0,
        "special_char_count": sum(ch in SPECIAL_CHARS for ch in payload),
        "pct_escape_count": len(PCT_ESCAPE.findall(raw_payload)),
        "digit_ratio": sum(ch.isdigit() for ch in payload) / n,
        "letter_ratio": sum(ch.isalpha() for ch in payload) / n,
        "non_alnum_ratio": sum(not ch.isalnum() and not ch.isspace() for ch in payload) / n,
        "payload_entropy": _entropy(payload),
        "sql_keyword_count": len(SQL_KEYWORDS.findall(payload)),
        "xss_keyword_count": len(XSS_KEYWORDS.findall(payload)),
        "path_traversal_flag": int(bool(TRAVERSAL.search(decoded_path) or TRAVERSAL.search(payload))),
        "ssi_cmd_flag": int(bool(SSI_CMD.search(payload))),
        "crlf_flag": int(bool(CRLF.search(raw_payload) or CRLF.search(payload))),
    }


def markdown_table() -> str:
    rows = ["| # | Feature | Definition | Why |", "|---|---|---|---|"]
    for i, (name, (definition, why)) in enumerate(FEATURES.items(), 1):
        rows.append(f"| {i} | `{name}` | {definition} | {why} |")
    return "\n".join(rows)


if __name__ == "__main__":
    if "--markdown" in sys.argv:
        print(markdown_table())
    else:
        print("\n".join(FEATURE_NAMES))
