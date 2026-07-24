import json, os
from normalisation.drugs import normalise

_PATH = os.path.join(os.path.dirname(__file__), "criteria.json")
with open(_PATH) as f:
    C = json.load(f)


def evaluate(record, mode="geriatric"):
    meds = record.get("medications", [])
    names = [normalise(m.get("generic") or m.get("name", "")) for m in meds]
    flags = []

    if mode == "geriatric":
        # ACB burden
        scored = [(n, C["acb_scale"][n]) for n in names if n in C["acb_scale"]]
        total = sum(s for _, s in scored)
        if total >= C["thresholds"]["acb_high"]:
            flags.append({
                "id": "acb_high", "severity": "high", "category": "cognitive",
                "title": f"Anticholinergic burden score: {total}",
                "detail": ("Multiple medications with anticholinergic activity. "
                           "A score of 3 or more is associated with confusion and "
                           "fall risk in older adults."),
                "involved": [n.title() for n, _ in scored],
                "source": "ACB Scale", "mode": "geriatric",
            })

        # Beers criteria
        for n in names:
            if n in C["beers_list"]:
                flags.append({
                    "id": f"beers_{n}", "severity": "medium", "category": "prescribing",
                    "title": f"{n.title()} is on the Beers list for adults 65+",
                    "detail": C["beers_list"][n],
                    "involved": [n.title()],
                    "source": "AGS Beers Criteria", "mode": "geriatric",
                })

        # Interactions
        for rule in C["interactions"]:
            a, b = rule["pair"]
            if a in names and b in names:
                flags.append({
                    "id": f"int_{a}_{b}", "severity": rule["severity"],
                    "category": "interaction",
                    "title": f"Interaction: {a.title()} + {b.title()}",
                    "detail": rule["detail"],
                    "involved": [a.title(), b.title()],
                    "source": "Interaction table", "mode": "geriatric",
                })

        # Multi-prescriber overlap
        prescribers = {m.get("prescriber") for m in meds if m.get("prescriber")}
        if len(prescribers) >= 3 and len(meds) >= C["thresholds"]["polypharmacy"]:
            flags.append({
                "id": "multi_prescriber", "severity": "medium", "category": "coordination",
                "title": f"{len(meds)} medications from {len(prescribers)} prescribers",
                "detail": ("No single prescriber has visibility of the complete "
                           "medication list."),
                "involved": sorted(prescribers),
                "source": "Polypharmacy threshold", "mode": "geriatric",
            })

    elif mode == "preop":
        for n in names:
            if n in C["preop_hold"]:
                h = C["preop_hold"][n]
                flags.append({
                    "id": f"hold_{n}", "severity": "high", "category": "preop",
                    "title": f"Stop {n.title()} — {h['days']} days before surgery",
                    "detail": h["reason"],
                    "involved": [n.title()],
                    "source": "Pre-operative hold guidance", "mode": "preop",
                })

    order = {"high": 0, "medium": 1, "low": 2}
    return sorted(flags, key=lambda f: order.get(f["severity"], 3))