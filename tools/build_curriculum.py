#!/usr/bin/env python3
"""Build curriculum/curriculum.json and one markdown file per phase from tools/src/*.txt.

Source format (one record per line, fields separated by ' | '):
  @phase NN | slug | title | tagline | course | eth(yes/no) | default tool | default lang [| track]
  (a ninth field "track" marks an optional build-along track: it has its own test and certificate but is not
  required for the full-course certificate)
  L title | goal | math | code | lab | test [| tool]
A code field starting with [C] / [Python] overrides the language.
A lab field starting with [live:ID] links the lesson to an interactive lab on the site.
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "src"
OUT = ROOT / "curriculum"

# Lesson-level course overrides. Only real ETH Zurich course titles we are confident about are
# flagged eth=True; everything else is a generic description.
OVERRIDES = [
    (r"Kalman|EKF|Unscented|Particle filter|SLAM|Tuning Q and R|State of charge", "Recursive Estimation", True),
    (r"Model predictive", "Model Predictive Control", True),
    (r"Matrix exponential|Controllability|Observability|separation principle", "Linear System Theory", True),
    (r"Hazard|Functional safety|Emergency stop|FMEA|Fault injection|Electrical safety|Watchdogs, plausibility", "Machine and functional safety (generic)", False),
    (r"Battery|Lithium|CC/CV|management and balancing", "Batteries and energy storage (generic)", False),
    (r"Mobile robot kinematics|Legged|Floating-base", "Autonomous Mobile Robots", True),
]
SWISS = re.compile(r"Swiss|ski|watch|escapement|rail|quadruped", re.I)
BALI = re.compile(r"Bali|scooter|irrigation|terrace", re.I)


def parse():
    phases = []
    for f in sorted(SRC.glob("*.txt")):
        for raw in f.read_text().splitlines():
            line = raw.strip()
            if not line:
                continue
            parts = [p.strip() for p in line[1:].split(" | ")] if line.startswith("@") else None
            if line.startswith("@phase"):
                fields = [p.strip() for p in line[len("@phase"):].split(" | ")]
                num, slug, title, tagline, course, eth, tool, lang = fields[:8]
                track = len(fields) > 8 and fields[8] == "track"
                phases.append(dict(id=f"p{int(num):02d}", number=int(num), slug=slug, title=title, tagline=tagline,
                                   course=dict(title=course, eth=(eth == "yes")), default_tool=tool, lang=lang, lessons=[],
                                   **({"track": True} if track else {})))
            elif line.startswith("L "):
                fields = [p.strip() for p in line[2:].split(" | ")]
                if len(fields) not in (6, 7):
                    raise SystemExit(f"bad field count {len(fields)} in {f.name}: {line[:80]}")
                title, goal, math, code, lab, test = fields[:6]
                ph = phases[-1]
                tool = fields[6] if len(fields) == 7 else ph["default_tool"]
                lang = ph["lang"]
                m = re.match(r"\[(C|Python)\]\s*", code)
                if m:
                    lang, code = m.group(1), code[m.end():]
                live = None
                m = re.match(r"\[live:(\w+)\]\s*", lab)
                if m:
                    live, lab = m.group(1), lab[m.end():]
                course = dict(ph["course"])
                for pat, ctitle, eth in OVERRIDES:
                    if re.search(pat, title, re.I):
                        course = dict(title=ctitle, eth=eth)
                        break
                blob = " ".join([title, goal, math, code, lab])
                anchors = [a for a, rx in (("Switzerland", SWISS), ("Bali", BALI)) if rx.search(blob)]
                n = len(ph["lessons"]) + 1
                ph["lessons"].append(dict(id=f"{ph['id']}-l{n:02d}", n=n, title=title, goal=goal, math=math,
                                          code=dict(lang=lang, task=code), lab=lab, live_lab=live, test=test,
                                          tool=tool, course=course, anchors=anchors))
    return phases


def md(ph):
    c = ph["course"]
    out = [f"# Phase {ph['number']:02d} · {ph['title']}", "", f"> {ph['tagline']}", ""] + (["Optional build-along track: it has its own phase test and certificate, and is not required for the full-course certificate.", ""] if ph.get("track") else []) + [
           f"- **Lessons:** {len(ph['lessons'])}",
           f"- **Maps to:** {c['title']}" + (" (ETH Zurich course title)" if c['eth'] else " (generic topic, not an exact ETH title)"),
           f"- **Main tool:** {ph['default_tool']} · **Default language:** {ph['lang']}", "",
           "Every lesson runs the same loop: **derive** the math by hand, **code** it from scratch, **test** it, **keep** the artifact.", ""]
    for l in ph["lessons"]:
        out += [f"## {l['id']} · {l['title']}", "", f"**Goal:** {l['goal']}", "",
                f"- **Derive by hand:** {l['math']}",
                f"- **Code from scratch ({l['code']['lang']}):** {l['code']['task']}",
                f"- **Interactive lab / visual:** {l['lab']}" + (f" → live lab on the site: `#lab-{l['live_lab']}`" if l['live_lab'] else ""),
                f"- **Test that proves it works:** {l['test']}",
                f"- **Pro / open-source tool it maps to:** {l['tool']}",
                f"- **Course mapping:** {l['course']['title']}" + (" (ETH)" if l['course']['eth'] else " (generic)")]
        if l["anchors"]:
            out.append(f"- **Real-world anchor:** {', '.join(l['anchors'])}")
        out.append("")
    return "\n".join(out)


def main():
    phases = parse()
    total = sum(len(p["lessons"]) for p in phases)
    data = dict(name="Mechatronics from Scratch", version="0.2.0", license="MIT",
                note="Course mappings flagged eth=true use real ETH Zurich course titles; others are generic topic names. Not affiliated with or endorsed by ETH Zurich.",
                labs={"pendulum": "Self-balancing robot (inverted pendulum, PID)", "arm": "Robot arm inverse kinematics",
                      "quad": "Quadcopter attitude control", "motor": "DC motor + encoder speed control",
                      "cable": "Cable-driven parallel robot (IK, tensions, workspace, swing, safety relax)"},
                totals=dict(phases=len(phases), lessons=total, core_phases=sum(1 for p in phases if not p.get("track")),
                            core_lessons=sum(len(p["lessons"]) for p in phases if not p.get("track"))), phases=phases)
    OUT.mkdir(exist_ok=True)
    (OUT / "curriculum.json").write_text(json.dumps(data, indent=1, ensure_ascii=False))
    idx = ["# Mechatronics from Scratch · Curriculum", "", f"{len(phases)} phases · {total} lessons. Generated from `tools/src/*.txt` by `tools/build_curriculum.py`; `curriculum.json` is the single source the site reads.", "",
           "| # | Phase | Lessons | Maps to |", "|---|---|---|---|"]
    for p in phases:
        fn = f"{p['number']:02d}-{p['slug']}.md"
        (OUT / fn).write_text(md(p))
        idx.append(f"| {p['number']:02d} | [{p['title']}]({fn}) | {len(p['lessons'])} | {p['course']['title']}{' (ETH)' if p['course']['eth'] else ''} |")
    (OUT / "README.md").write_text("\n".join(idx) + "\n")
    for p in phases:
        print(f"{p['number']:02d} {p['title']}: {len(p['lessons'])}")
    print("TOTAL", len(phases), total)


if __name__ == "__main__":
    main()
