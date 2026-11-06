"""Parse raw CSIC 2010 text files into individual HTTP requests.

File format (observed in the raw files):
    <METHOD> http://localhost:8080/<path>[?query] HTTP/1.1
    Header: value
    ...
    <blank line>
    [body line, POST/PUT only]
    <blank line(s)>

A new request starts at every line matching REQUEST_LINE. Anything before the
first request line, or a block whose first line does not match, is counted as a
parse failure so we can report it (it goes in the limitations section).

The files are Latin-1 (Spanish e-commerce app: %F1 = n-tilde, etc.), so we read
them as latin-1, which never fails to decode.
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

REQUEST_LINE = re.compile(r"^(GET|POST|PUT|DELETE|HEAD|OPTIONS|TRACE|PATCH) (\S+) (HTTP/\d\.\d)\s*$")


@dataclass
class Request:
    method: str
    url: str            # full URL as written in the request line
    path: str           # e.g. /tienda1/publico/anadir.jsp
    query: str          # raw (still percent-encoded) query string, without '?'
    body: str           # raw (still percent-encoded) body, '' for GET
    headers: dict = field(default_factory=dict)

    @property
    def dedup_key(self) -> str:
        """Identity of a request for duplicate checks.

        Excludes headers on purpose: Cookie carries a random JSESSIONID per
        request, and the other headers are constant across the whole dataset,
        so including them would hide real duplicates.
        """
        return f"{self.method} {self.path}?{self.query}\n{self.body}"


@dataclass
class ParseResult:
    requests: list
    failures: list      # (line_number, first_line) for blocks that did not parse


def parse_file(path: Path) -> ParseResult:
    with open(path, encoding="latin-1", newline="") as f:
        lines = f.read().replace("\r\n", "\n").split("\n")

    requests, failures = [], []
    starts = [i for i, line in enumerate(lines) if REQUEST_LINE.match(line)]

    # Non-blank content before the first request line is a failure.
    first = starts[0] if starts else len(lines)
    if any(l.strip() for l in lines[:first]):
        failures.append((1, next(l for l in lines[:first] if l.strip())[:120]))

    for n, start in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else len(lines)
        try:
            requests.append(_parse_block(lines[start:end]))
        except ValueError as exc:
            failures.append((start + 1, f"{exc}: {lines[start][:120]}"))
    return ParseResult(requests, failures)


def _parse_block(block: list) -> Request:
    m = REQUEST_LINE.match(block[0])
    method, url = m.group(1), m.group(2)

    headers, i = {}, 1
    while i < len(block) and block[i].strip():
        name, sep, value = block[i].partition(":")
        if not sep:
            raise ValueError(f"malformed header line {block[i][:60]!r}")
        headers[name.strip().lower()] = value.strip()
        i += 1

    # Everything non-blank after the header/body separator is the body.
    body = "\n".join(l for l in block[i + 1:] if l.strip())
    if method == "GET" and body:
        raise ValueError("GET request with a body")

    parts = urlsplit(url)
    return Request(method=method, url=url, path=parts.path, query=parts.query,
                   body=body, headers=headers)
