from engine import evaluate

def rec(*names, prescribers=None):
    ps = prescribers or ["Dr. A"] * len(names)
    return {"medications": [{"name": n, "generic": n.lower(), "prescriber": p}
                             for n, p in zip(names, ps)]}

def test_acb_fires():
    f = evaluate(rec("Amitriptyline", "Oxybutynin"), "geriatric")
    assert any(x["id"] == "acb_high" for x in f)

def test_acb_silent_when_low():
    f = evaluate(rec("Loratadine"), "geriatric")
    assert not any(x["id"] == "acb_high" for x in f)

def test_beers_fires():
    f = evaluate(rec("Diazepam"), "geriatric")
    assert any(x["id"] == "beers_diazepam" for x in f)

def test_interaction_needs_both():
    assert not any(x["category"] == "interaction"
                   for x in evaluate(rec("Warfarin"), "geriatric"))
    assert any(x["category"] == "interaction"
               for x in evaluate(rec("Warfarin", "Aspirin"), "geriatric"))

def test_preop_hold():
    f = evaluate(rec("Clopidogrel"), "preop")
    assert any("7 days" in x["title"] for x in f)

def test_mode_isolation():
    assert all(x["mode"] == "preop" for x in evaluate(rec("Clopidogrel"), "preop"))