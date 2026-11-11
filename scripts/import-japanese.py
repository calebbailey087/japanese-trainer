#!/usr/bin/env python3
"""Build compact, attributed study data from EDRDG and Tatoeba, never an AI.

Run: python3 scripts/import-japanese.py [--refresh]
Raw downloads are cached in ignored generated-artifacts/, not Git.
"""
import argparse
import bz2
import datetime as dt
import gzip
import hashlib
import io
import json
from pathlib import Path
import re
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "generated-artifacts/japanese-sources"
OUT = ROOT / "artifacts/kana-practice/src/data/generated"
SOURCES = {
    "kanjidic2.xml.gz": "https://www.edrdg.org/kanjidic/kanjidic2.xml.gz",
    "JMdict_e.gz": "https://www.edrdg.org/pub/Nihongo/JMdict_e.gz",
    "jpn-eng.zip": "https://www.manythings.org/anki/jpn-eng.zip",
    "jpn_transcriptions.tsv.bz2": "https://downloads.tatoeba.org/exports/per_language/jpn/jpn_transcriptions.tsv.bz2",
}
PRIORITY = {"news1", "ichi1", "spec1"}
BAD_WRITING = {"rarely used kanji form", "word containing irregular kanji usage",
               "ateji (phonetic) reading", "search-only kanji form"}
BAD_READING = {"word containing irregular kana usage", "rarely used kana form", "search-only kana form"}
TOPICS = {
    "food": ["food", "eat", "drink", "rice", "meal", "tea", "fruit", "fish", "restaurant"],
    "transport": ["train", "station", "bus", "transport", "railway", "airport", "taxi"],
    "school": ["school", "student", "teacher", "university", "study", "classroom"],
    "health": ["health", "hospital", "doctor", "medicine", "pain", "illness", "allergy"],
    "shopping": ["buy", "sell", "shop", "price", "money", "yen", "store"],
    "time": ["time", "hour", "minute", "morning", "night", "day", "year", "week"],
    "people": ["person", "people", "family", "friend", "child", "mother", "father"],
}

def download(name, refresh):
    path = CACHE / name
    if refresh or not path.exists():
        req = urllib.request.Request(SOURCES[name], headers={"User-Agent": "KanaStudyDataImporter/1.0"})
        with urllib.request.urlopen(req, timeout=120) as response:
            data = response.read()
        path.write_bytes(data)
    return path

def hira(text):
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in text)

def chars(text):
    kana = sorted(set(c for c in text if "\u3041" <= c <= "\u30fa" and c not in "・"))
    kanji = sorted(set(c for c in text if "\u3400" <= c <= "\u9fff" or "\U00020000" <= c <= "\U000323af"))
    return kana, kanji

def make_item(id_, kind, japanese, reading, meanings, **extra):
    kana, kanji = chars(japanese + reading)
    return dict(id=id_, kind=kind, japanese=japanese, reading=hira(reading),
                meanings=meanings, **dict(requiresKana=kana, requiresKanji=kanji, requiresWords=[]) | extra)

def common_pairs(entry):
    """Keep priority on the actual spelling, never inherited from a sibling form."""
    pairs = []
    for written in entry.findall("k_ele"):
        priorities = {x.text for x in written.findall("ke_pri")}
        if not priorities or BAD_WRITING.intersection(x.text for x in written.findall("ke_inf")):
            continue
        spelling = written.findtext("keb")
        for reading in entry.findall("r_ele"):
            if reading.find("re_nokanji") is not None or BAD_READING.intersection(x.text for x in reading.findall("re_inf")):
                continue
            restrictions = [x.text for x in reading.findall("re_restr")]
            kana = reading.findtext("reb")
            if kana and spelling and (not restrictions or spelling in restrictions):
                pairs.append((spelling, kana, priorities))
    return pairs

def pair_meanings(entry, spelling, reading, written_only=False):
    """Respect sense restrictions as well as spelling/reading restrictions."""
    meanings = []
    for sense in entry.findall("sense"):
        writings = [x.text for x in sense.findall("stagk")]
        readings = [x.text for x in sense.findall("stagr")]
        if (writings and spelling not in writings) or (readings and reading not in readings):
            continue
        if written_only and any(x.text == "word usually written using kana alone" for x in sense.findall("misc")):
            continue
        meanings.extend(g.text for g in sense.findall("gloss")
                        if g.text and g.get("{http://www.w3.org/XML/1998/namespace}lang") in (None, "eng"))
    return list(dict.fromkeys(meanings))[:6]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    paths = {name: download(name, args.refresh) for name in SOURCES}
    # Preserve the supplied 75-character starter order.
    starter = ROOT / "scripts/data/starter-kanji.txt"
    groups, starter_order, starter_examples = [], [], {}
    for line in starter.read_text().splitlines():
        if line.startswith("GROUP "):
            groups.append({"id": f"group-{len(groups)+1}", "name": line.split(": ", 1)[1].title(), "characters": []})
        elif re.match(r"^[\u3400-\u9fff] \|", line):
            c = line[0]
            groups[-1]["characters"].append(c)
            starter_order.append(c)
            match = re.match(r"(.+?) \(([^=]+) = (.+)\)", line.split("|")[-1].strip())
            if match:
                starter_examples[c] = (match[1].strip(), match[2].strip())
    kanji = []
    with gzip.open(paths["kanjidic2.xml.gz"], "rb") as f:
        for _, element in ET.iterparse(f, events=("end",)):
            if element.tag != "character":
                continue
            grade = int(element.findtext("misc/grade", "0"))
            if grade in {1, 2, 3, 4, 5, 6, 8}:
                on, kun, meanings = [], [], []
                for reading in element.findall("reading_meaning/rmgroup/reading"):
                    target = on if reading.get("r_type") == "ja_on" else kun if reading.get("r_type") == "ja_kun" else None
                    if target is not None:
                        target.append(hira(reading.text or ""))
                for meaning in element.findall("reading_meaning/rmgroup/meaning"):
                    if meaning.get("m_lang") in (None, "en"):
                        meanings.append(meaning.text)
                kanji.append(dict(char=element.findtext("literal"), meanings=meanings, on=on, kun=kun,
                                  grade=grade, jlpt=int(element.findtext("misc/jlpt", "0")) or None,
                                  frequency=int(element.findtext("misc/freq", "0")) or None,
                                  strokes=int(element.findtext("misc/stroke_count")), examples=[]))
            element.clear()
    assert len(kanji) == 2136, f"Expected 2,136 joyo kanji, got {len(kanji)}"
    kanji.sort(key=lambda k: (0, starter_order.index(k["char"])) if k["char"] in starter_order else (1, k["grade"], k["frequency"] or 99999, k["char"]))
    remaining = [k["char"] for k in kanji if k["char"] not in starter_order]
    for grade in [1, 2, 3, 4, 5, 6, 8]:
        grade_chars = [c for c in remaining if next(k["grade"] for k in kanji if k["char"] == c) == grade]
        for start in range(0, len(grade_chars), 15):
            label = f"Grade {grade}" if grade != 8 else "Secondary school"
            groups.append(dict(id=f"group-{len(groups)+1}", name=f"{label} · set {start//15+1}", characters=grade_chars[start:start+15]))
    group_for = {c: g["id"] for g in groups for c in g["characters"]}
    by_char = {k["char"]: k for k in kanji}
    # Read full English JMdict including its entity definitions using stdlib XML.
    candidates = []
    example_candidates = {k["char"]: [] for k in kanji}
    with gzip.open(paths["JMdict_e.gz"], "rb") as f:
        for _, e in ET.iterparse(f, events=("end",)):
            if e.tag != "entry":
                continue
            pairs = common_pairs(e)
            for written, kana, priorities in pairs:
                meanings = pair_meanings(e, written, kana, written_only=True)
                if not meanings:
                    continue
                reading_priority = {p.text for r in e.findall("r_ele") if r.findtext("reb") == kana for p in r.findall("re_pri")}
                example = dict(japanese=written, reading=hira(kana), meaning=meanings[0], common=True,
                               sourceId=e.findtext("ent_seq"), writingPriority=sorted(priorities), readingPriority=sorted(reading_priority))
                for c in set(written) & by_char.keys():
                    # A starter may only select an already-safe dictionary pair.
                    starter_first = starter_examples.get(c) == (written, kana)
                    rank = (not starter_first, -len(priorities & PRIORITY), -len(reading_priority & PRIORITY), len(chars(written)[1]), len(written), written, kana)
                    example_candidates[c].append((rank, example))
            readings = [r for r in e.findall("r_ele") if not r.findall("re_restr")
                        and not BAD_READING.intersection(x.text for x in r.findall("re_inf"))]
            if not readings:
                e.clear()
                continue
            reading = readings[0].findtext("reb")
            # Vocabulary uses a safe common pair, or a clean kana-only entry.
            if pairs:
                pairs.sort(key=lambda p: (-len(p[2] & PRIORITY), len(p[0]), p[0], p[1]))
                japanese, reading, _ = pairs[0]
            elif e.findall("k_ele"):
                e.clear()
                continue
            else:
                japanese = reading
            meanings = pair_meanings(e, japanese, reading)
            priorities = {p.text for p in e.findall("k_ele/ke_pri") + e.findall("r_ele/re_pri")}
            common = bool(priorities & PRIORITY)
            if japanese and reading and meanings:
                candidate = make_item(f"vocab:{e.findtext('ent_seq')}", "vocab", japanese, reading, meanings[:6],
                                      topic=next((tag for tag, words in TOPICS.items() if any(re.search(r"\b"+re.escape(w)+r"\b", " ".join(meanings).lower()) for w in words)), "general"),
                                      source="JMdict", priority=sorted(priorities & PRIORITY))
                if common:
                    candidates.append(candidate)
            e.clear()
    # Common first; prefer simpler, shorter forms for a beginner.
    candidates.sort(key=lambda w: (-len(w["priority"]), len(w["requiresKanji"]), len(w["japanese"]), w["id"]))
    vocabulary = [w for w in candidates if all(c in by_char for c in w["requiresKanji"])][:5000]
    # Examples are real dictionary data and can be queried even when not in vocab.
    for k in kanji:
        k["groupId"] = group_for[k["char"]]
        seen_examples = set()
        for _, example in sorted(example_candidates[k["char"]], key=lambda x: x[0]):
            if example["japanese"] in seen_examples:
                continue
            seen_examples.add(example["japanese"])
            k["examples"].append(example)
            if len(k["examples"]) == 3:
                break
        if not k["examples"]:
            # Explicit empty, never fabricated.
            k["exampleStatus"] = "No common, unflagged JMdict spelling/reading pair available."
    # Conservative complete segmentation: every meaningful character must match
    # a loaded word. Ambiguous/unknown morphology stays OUT, never auto-unlocks.
    forms = {}
    for word in vocabulary:
        for form in {word["japanese"], word["reading"]}:
            forms.setdefault(form, word)
    indexes = {}
    for form in forms:
        indexes.setdefault(form[0], []).append(form)
    for matches in indexes.values():
        matches.sort(key=len, reverse=True)
    punctuation = set("。、！？!?「」『』（）()・…—- 　,.\"'")
    particles = set("はがをにでへとものやかねよ")
    def segment(text):
        memo = {}
        def walk(pos):
            if pos == len(text):
                return []
            if pos in memo:
                return memo[pos]
            c = text[pos]
            if c in punctuation:
                result = walk(pos+1)
                memo[pos] = result
                return result
            for form in indexes.get(c, []):
                if text.startswith(form, pos):
                    rest = walk(pos+len(form))
                    if rest is not None:
                        result = [("word", form, forms[form])] + rest
                        memo[pos] = result
                        return result
            if c in particles:
                rest = walk(pos+1)
                if rest is not None:
                    result = [("particle", c, None)] + rest
                    memo[pos] = result
                    return result
            memo[pos] = None
            return None
        return walk(0)
    # Use source-provided furigana, never guessed dictionary concatenations.
    transcriptions = {}
    with bz2.open(paths["jpn_transcriptions.tsv.bz2"], "rt", encoding="utf-8") as f:
        for line in f:
            fields = line.rstrip("\n").split("\t")
            if len(fields) != 5 or fields[1:3] != ["jpn", "Hrkt"]:
                continue
            sid, _, _, author, text = fields
            surface = re.sub(r"\[([^|\]]+)\|[^\]]+\]", lambda m: m[1], text)
            reading = re.sub(r"\[([^|\]]+)\|([^\]]+)\]", lambda m: m[2].replace("|", ""), text)
            if "[" not in reading and "]" not in reading:
                transcriptions.setdefault(sid, (surface, hira(reading), author))
    sentences, seen = [], set()
    with zipfile.ZipFile(paths["jpn-eng.zip"]) as z:
        txt = next(n for n in z.namelist() if n.endswith(".txt") and not n.startswith("_"))
        for line in io.TextIOWrapper(z.open(txt), encoding="utf-8-sig"):
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 3:
                continue
            english, japanese, attribution = parts[:3]
            if japanese in seen or not 3 <= len(japanese) <= 32:
                continue
            tokens = segment(japanese)
            if not tokens or not any(t[0] == "word" for t in tokens):
                continue
            ids = re.findall(r"#(\d+)", attribution)
            sid = ids[-1] if ids else hashlib.sha256(japanese.encode()).hexdigest()[:12]
            transcription = transcriptions.get(sid)
            if transcription and transcription[0] == japanese:
                reading = transcription[1]
                attribution += f"; kana transcription: {transcription[2]} (Tatoeba #{sid})"
            elif not chars(japanese)[1]:
                reading = hira(japanese)
            else:
                continue
            if chars(reading)[1]:
                continue
            seen.add(japanese)
            particle_indices = []
            offset = 0
            for kind, form, _ in tokens:
                # Locate token boundaries in original text (including punctuation).
                position = japanese.find(form, offset)
                if kind == "particle" and form in "はがをにでへ" and position > 0:
                    particle_indices.append(position)
                offset = position + len(form)
            sentences.append(make_item(f"sentence:{sid}", "sentence", japanese, reading, [english],
                                       requiresWords=list(dict.fromkeys(t[2]["id"] for t in tokens if t[0] == "word")),
                                       source="Tatoeba", attribution=attribution, particleIndices=particle_indices,
                                       note="Tatoeba source transcription (or original kana-only text). Word coverage checked against the loaded vocabulary."))
            if len(sentences) >= 1000:
                break
    # Audio always reads the original Japanese, not a synthesized transcript.
    assert len(vocabulary) >= 3000
    assert len(sentences) >= 50, f"Only {len(sentences)} fully covered sentence pairs"
    meta = dict(importedAt=dt.datetime.now(dt.timezone.utc).isoformat(), kanjiCount=len(kanji),
                vocabularyCount=len(vocabulary), sentenceCount=len(sentences), starterCount=len(starter_order),
                sources=[dict(file=n, url=SOURCES[n], sha256=hashlib.sha256(paths[n].read_bytes()).hexdigest()) for n in SOURCES],
                dictionaryLicense="CC BY-SA 4.0", sentenceLicense="CC BY 2.0 FR",
                kanjiOrder="75 starter kanji, then school grade (1-6, 8), then frequency within grade.",
                examplePolicy="Distinct common written forms with spelling-level priority; no rK/iK/ateji/sK or ik/rk/sk; reading and sense restrictions respected.",
                sentencePolicy="Only sentences fully segmented against the loaded dictionary; word IDs retained for conservative unlocking. No AI-generated readings or meanings.")
    bundle = dict(kanji=kanji, vocabulary=vocabulary, sentences=sentences, groups=groups, meta=meta)
    (OUT / "content.json").write_text(json.dumps(bundle, ensure_ascii=False, separators=(",", ":")))
    (OUT / "manifest.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    print(f"Runtime JSON: {(OUT/'content.json').stat().st_size:,} bytes")

if __name__ == "__main__":
    main()
