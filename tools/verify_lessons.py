#!/usr/bin/env python3
"""Verify every full lesson in lessons/pNN/*.md:
  1. run each :::code python block (it must contain its own asserts and exit 0),
  2. run each :::verify block (asserts that recompute the worked-example numbers),
  3. evaluate the `py:` expression of every numeric quiz question and compare with `answer` (relative tol, abs if answer==0),
  4. check multiple-choice answers have a valid index.
Exit code 1 on any failure."""
import pathlib, re, subprocess, sys, tempfile, textwrap
import yaml  # PyYAML
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
fails, checked = [], {"code": 0, "verify": 0, "num": 0, "mc": 0}

def blocks(text):
    lines = text.split("\n"); i = 0
    while i < len(lines):
        m = re.match(r"^:::(\w+)\s*(.*)$", lines[i])
        if m and m.group(1) not in ("end", "solution"):
            kind, attrs, inner = m.group(1), m.group(2), []
            i += 1
            while i < len(lines) and not re.match(r"^:::end\s*$", lines[i]):
                inner.append(lines[i]); i += 1
            yield kind, attrs, "\n".join(inner)
        i += 1

def run_py(src, label, cwd):
    p = subprocess.run([sys.executable, "-c", src], cwd=cwd, capture_output=True, text=True, timeout=120)
    if p.returncode != 0:
        fails.append(f"{label}: exit {p.returncode}\n{p.stderr[-1500:]}")

import sys
PAT = sys.argv[1] if len(sys.argv) > 1 else "p[0-9][0-9]"   # e.g. p03 or p03/0[1-4]*
for md in sorted(ROOT.glob(f"lessons/{PAT}*.md" if "/" in PAT else f"lessons/{PAT}/*.md")):
    text = md.read_text()
    lid = re.search(r"^id:\s*(\S+)", text, re.M).group(1)
    with tempfile.TemporaryDirectory() as tmp:
        for kind, attrs, inner in blocks(text):
            if kind == "code":
                m = re.search(r"```(\w+)\n([\s\S]*?)\n```", inner)
                if m.group(1) == "python":
                    run_py(m.group(2), f"{lid} code {attrs}", tmp); checked["code"] += 1
                elif m.group(1) == "c":
                    src = pathlib.Path(tmp) / "x.c"; src.write_text(m.group(2))
                    c = subprocess.run(["gcc", "-std=c99", "-Wall", "-Werror", "-O1", "-o", str(pathlib.Path(tmp) / "x"), str(src), "-lm"], capture_output=True, text=True)
                    if c.returncode: fails.append(f"{lid} C compile: {c.stderr[-800:]}")
                    else:
                        r = subprocess.run([str(pathlib.Path(tmp) / "x")], capture_output=True, text=True, timeout=60)
                        if r.returncode: fails.append(f"{lid} C run exit {r.returncode}: {r.stdout[-400:]}{r.stderr[-400:]}")
                    checked["code"] += 1
            elif kind == "verify":
                run_py(inner, f"{lid} verify", tmp); checked["verify"] += 1
            elif kind == "quiz":
                try:
                    items = yaml.safe_load(inner)
                except yaml.YAMLError as e:
                    fails.append(f"{lid} quiz YAML: {e}"); continue
                for n, q in enumerate(items, 1):
                    if q["type"] == "num":
                        env = {"np": np, "math": __import__("math")}
                        try:
                            val = float(eval(q["py"], env))
                        except Exception as e:
                            fails.append(f"{lid} q{n} py error: {e}"); continue
                        ans, tol = float(q["answer"]), float(q.get("tol", 0.01))
                        ok = abs(val - ans) <= (tol * abs(val) if val != 0 else tol)
                        if not ok: fails.append(f"{lid} q{n}: answer {ans} but python gives {val}")
                        checked["num"] += 1
                    else:
                        if not (0 <= q["answer"] < len(q["options"])): fails.append(f"{lid} q{n}: bad mc index")
                        checked["mc"] += 1
print("checked:", checked)
if fails:
    print("\n".join("FAIL " + f for f in fails)); sys.exit(1)
print("all lesson checks passed")
