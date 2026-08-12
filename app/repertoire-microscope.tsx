"use client";

import { useState } from "react";
import { getPersonalizedRepertoireTransfer } from "./repertoire-analysis.mjs";

export type RepertoireAnalysis = {
  id: string;
  sectionTitle: string;
  lens: string;
  functionPath: string[];
  mechanism: string;
  voiceLeading: string;
  listenFor: string;
  experiment: string;
  demo: number[][];
  transferSeed: string;
};

type RepertoireMicroscopeProps = {
  analysis: RepertoireAnalysis;
  totalSections: number;
  exploredIds: string[];
  preferences: string[];
  onPlay: (demo: number[][]) => void;
  onExplore: (analysisId: string) => void;
};

export function RepertoireMicroscope({
  analysis,
  totalSections,
  exploredIds,
  preferences,
  onPlay,
  onExplore,
}: RepertoireMicroscopeProps) {
  const [auditionedId, setAuditionedId] = useState<string | null>(null);
  const explored = exploredIds.includes(analysis.id);
  const auditioned = auditionedId === analysis.id;
  const transfer = getPersonalizedRepertoireTransfer(analysis, preferences);

  return (
    <section className="repertoire-microscope" aria-label={`Harmonic analysis of ${analysis.sectionTitle}`}>
      <div className="repertoire-lens-heading">
        <div>
          <p className="eyebrow">Why these notes? · {analysis.sectionTitle}</p>
          <h3>{analysis.lens}</h3>
        </div>
        <span>{exploredIds.length}/{totalSections} connections explored</span>
      </div>

      <ol className="harmonic-path" aria-label="Harmonic function path">
        {analysis.functionPath.map((item, index) => (
          <li key={`${item}-${index}`}><span>{index + 1}</span><strong>{item}</strong>{index < analysis.functionPath.length - 1 && <i aria-hidden="true">→</i>}</li>
        ))}
      </ol>

      <div className="theory-cause-effect">
        <article><span>What causes the feeling</span><p>{analysis.mechanism}</p></article>
        <article><span>Follow one voice</span><p>{analysis.voiceLeading}</p></article>
        <article><span>Listen for</span><p>{analysis.listenFor}</p></article>
      </div>

      <div className="repertoire-experiment">
        <div><span>Test the idea</span><p>{analysis.experiment}</p></div>
        <button className="secondary-button" onClick={() => { onPlay(analysis.demo); setAuditionedId(analysis.id); }}>▶ Hear the harmonic path</button>
      </div>

      <div className="repertoire-transfer">
        <div><span>Use it in your music</span><p>{transfer}</p></div>
        <button
          className={explored ? "connection-button explored" : "connection-button"}
          disabled={!auditioned && !explored}
          onClick={() => onExplore(analysis.id)}
        >
          {explored ? "✓ Connection saved" : auditioned ? "I can hear the connection" : "Hear it before saving"}
        </button>
      </div>
    </section>
  );
}
