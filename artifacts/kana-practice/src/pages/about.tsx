import { ExternalLink } from 'lucide-react';
import { CatalogGate, PageHead } from '@/components/study/common';

const A = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline underline-offset-4" data-testid={`link-src-${href.replace(/\W+/g, '-').slice(8, 40)}`}>{children}<ExternalLink className="w-3 h-3" /></a>;

export default function About() {
  return (
    <div className="space-y-8 max-w-3xl">
      <PageHead kicker="出典 / sources" title="About the data">Study content is bundled for offline use after the first online visit to the production app. Progress stays in this browser; no app server receives it. Speech depends on your device's Japanese voice and may need a connection.</PageHead>
      <CatalogGate>{(c) => {
        const m = c.meta;
        return (<>
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[[m.kanjiCount, 'kanji'], [m.vocabularyCount, 'dictionary words'], [m.sentenceCount, 'sentence pairs'], [m.starterCount, 'starter kanji']].map(([n, l]) => (
              <div key={l} className="stat-card rounded-2xl border bg-card p-4"><div className="text-3xl font-extrabold tabular-nums" data-testid={`text-count-${String(l).replace(/\s/g, '-')}`}>{Number(n).toLocaleString()}</div><div className="text-xs text-muted-foreground">{l}</div></div>
            ))}
          </section>
          <p className="text-sm text-muted-foreground" data-testid="text-imported-at">Imported {new Date(m.importedAt).toLocaleString()}. Items in the app total {c.items.length.toLocaleString()}.</p>
          <section className="rounded-2xl border bg-card p-5 space-y-3 text-sm">
            <h2 className="font-bold text-base">Kanji and dictionary</h2>
            <p>Kanji meanings, readings, stroke counts, grades and frequency come from <A href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project">KANJIDIC2</A>. Vocabulary comes from <A href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project">JMdict</A>. Both are property of the Electronic Dictionary Research and Development Group and used under their <A href="https://www.edrdg.org/edrdg/licence.html">licence</A>, Creative Commons Attribution-ShareAlike 4.0.</p>
            <p className="text-muted-foreground">{m.dictionaryLicense}</p>
            <p>The generated dictionary extracts bundled here are shared under CC BY-SA 4.0. That licence covers the extracted data only, not the application code.</p>
            <p>After the 75 starter kanji, characters follow school grade (1–6, then secondary school), with frequency ordering inside each grade. Examples require common spelling-level priority, clean readings and matching sense restrictions. Rare/irregular/ateji/search-only forms are excluded and written examples are deduplicated.</p>
            <p>{c.kanji.filter((k) => !k.examples.length).length} kanji have no qualifying common example and remain reference-only in the Library; they are not quizzed or required for group progression.</p>
          </section>
          <section className="rounded-2xl border bg-card p-5 space-y-3 text-sm">
            <h2 className="font-bold text-base">Sentences</h2>
            <p>Example sentence pairs come from the <A href="https://tatoeba.org">Tatoeba</A> project under CC BY 2.0 FR, via the <A href="https://www.manythings.org/anki/">ManyThings.org</A> export. Each sentence keeps its own attribution, shown in its detail and after you answer.</p>
            <p className="text-muted-foreground">{m.sentenceLicense}</p>
            <p className="text-muted-foreground">{m.sentencePolicy}</p>
          </section>
          <section className="rounded-2xl border bg-card p-5 space-y-3 text-sm">
            <h2 className="font-bold text-base">Source files</h2>
            <ul className="space-y-2">{m.sources.map((s) => <li key={s.file} className="break-all"><A href={s.url}>{s.file}</A><div className="font-mono text-[11px] text-muted-foreground">sha256 {s.sha256}</div></li>)}</ul>
          </section>
        </>);
      }}</CatalogGate>
      <section className="rounded-2xl border border-dashed p-5 text-sm space-y-2">
        <h2 className="font-bold text-base">Updating the data</h2>
        <p>Run the importer from the project folder to download fresh sources and rebuild the compact dataset:</p>
        <pre className="rounded-xl bg-ink text-background px-4 py-3 overflow-x-auto font-mono text-xs" data-testid="text-update-command">python3 scripts/import-japanese.py --refresh</pre>
        <p className="text-muted-foreground">Update at least monthly before distributing a fresh dictionary. Raw downloads are ignored by version control; only the compact generated dataset is bundled, so the app stays offline. Stroke-order diagrams (KanjiVG) are optional and not included.</p>
        <a className="text-primary underline" href={`${import.meta.env.BASE_URL}data-sources.txt`}>Bundled source and license documentation</a>
      </section>
      <section className="rounded-2xl border bg-card p-5 text-sm space-y-2">
        <h2 className="font-bold text-base">Application license</h2>
        <p>Application source code is MIT licensed. Dictionary and sentence data retain their original licenses. MIT does not relicense the generated data; adapted dictionary data must retain attribution and share-alike terms. KanjiVG is not used. If added later, its material requires CC BY-SA 3.0 attribution and share-alike licensing.</p>
      </section>
      <section className="rounded-2xl border bg-card p-5 text-sm space-y-2">
        <h2 className="font-bold text-base">Speech</h2>
        <p className="text-muted-foreground">Audio uses your browser's built-in Japanese voice. If none is installed, listening options are disabled.</p>
      </section>
    </div>
  );
}
