# Question bank pipeline

`backend/data/questions.json` is generated. Rebuild it with:

```bash
python backend/tools/fetch_sources.py   # download pinned public datasets into backend/data/sources/ (gitignored)
python backend/tools/build_bank.py      # merge, cross-check, sanitize -> data/questions.json + data/build_report.json
```

## Sources

| Source | What it gives | Used for |
|---|---|---|
| `data/pdf_bank.json` | Our own College Board Question Bank PDF export (Aug 2025), parsed by `parse_all_rw.py` (R&W) and `import_math.py` (Math answer keys) | Answer keys, metadata |
| `sources/mdn522` | College Board's own JSON (HTML + MathML), Sep 2024, with the list of questions used in Bluebook practice tests | Content (preferred), keys, Bluebook flag |
| `sources/cbqb` | PDF export from Oct 2026, Bluebook questions excluded (HTML, math as sprite images) | Content for newer questions, keys, current difficulty |
| `sources/girff` | Full export from Oct 2026 (every assessment, Bluebook questions included) | Cross-checking keys/difficulty, detecting retired questions |

## Rules applied by `build_bank.py`

- **Core bank** = questions in the current non-Bluebook exports (`pdf_bank` ∪ `cbqb`). Questions that only exist in
  mdn522's Bluebook list get `"bluebook": true` and are only served when a player opts in.
- **Retired questions** (no longer in the Oct 2026 full export) and questions whose math is missing in College Board's
  own source are excluded.
- **Answer keys** are compared across every source; `sources` lists the ones that agree. Conflicts go to
  `build_report.json`. Two rationales that name the wrong letter (options were reordered) are fixed in `RATIONALE_ERRATA`.
- **Difficulty** comes from the newest export (College Board re-rated ~140 questions between 2025 and 2026).
- **HTML** is sanitized to an allowlist; inline SVG and base64 images are written to `frontend/public/media/cb/`
  (named by content hash) and `<mfenced>` is rewritten for MathML Core.
- **Math figures from cbqb** have their labels (t, j, k, "Note: Figure not drawn to scale.") cut out as separate
  fragments around the image. For those questions the figure and its fragments are replaced by girff's complete
  figure image (downloaded on demand into `sources/girff/figures/`, copied to `frontend/public/media/girff/`).
- Six cbqb questions whose math is missing in College Board's own export are excluded.
