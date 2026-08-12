"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import type { ScoreSection } from "./curriculum";

type PlayedNoteEvent = { midi: number; token: number } | null;

type ScoreReaderProps = {
  title: string;
  composer: string;
  scoreUrl: string;
  totalMeasures: number;
  sections: ScoreSection[];
  playedNote: PlayedNoteEvent;
  completedMeasures: number[];
  onMeasureComplete: (measure: number) => void;
  onFeedback: (message: string) => void;
};

function midiFromFrequency(frequency: number) {
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

function nameMidi(midi: number) {
  const names = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export function ScoreReader({
  title,
  composer,
  scoreUrl,
  totalMeasures,
  sections,
  playedNote,
  completedMeasures,
  onMeasureComplete,
  onFeedback,
}: ScoreReaderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const matchedNotesRef = useRef<Set<number>>(new Set());
  const activeSectionRef = useRef(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [activeSection, setActiveSection] = useState(0);
  const [following, setFollowing] = useState(false);
  const [loopSection, setLoopSection] = useState(true);
  const [expectedNotes, setExpectedNotes] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);

  const readExpectedNotes = useCallback(() => {
    const osmd = osmdRef.current;
    if (!osmd) return [];
    return [...new Set(
      osmd.cursor
        .NotesUnderCursor()
        .filter((note) => !note.isRest() && note.Pitch?.Frequency)
        .map((note) => midiFromFrequency(note.Pitch.Frequency)),
    )].sort((a, b) => a - b);
  }, []);

  const updateCursorState = useCallback(() => {
    const osmd = osmdRef.current;
    if (!osmd) return;
    const measure = Math.min(totalMeasures, osmd.cursor.Iterator.CurrentMeasureIndex + 1);
    setCurrentMeasure(measure);
    setExpectedNotes(readExpectedNotes());
    const sectionIndex = sections.findIndex(
      (section) => measure >= section.measures[0] && measure <= section.measures[1],
    );
    if (sectionIndex >= 0) {
      activeSectionRef.current = sectionIndex;
      setActiveSection(sectionIndex);
    }
  }, [readExpectedNotes, sections, totalMeasures]);

  const jumpToMeasure = useCallback((measure: number) => {
    const osmd = osmdRef.current;
    if (!osmd) return;
    osmd.cursor.reset();
    for (let index = 1; index < measure; index += 1) osmd.cursor.nextMeasure();
    matchedNotesRef.current.clear();
    setMatchedCount(0);
    updateCursorState();
  }, [updateCursorState]);

  const chooseSection = useCallback((index: number) => {
    const section = sections[index];
    activeSectionRef.current = index;
    setActiveSection(index);
    jumpToMeasure(section.measures[0]);
    onFeedback(`${section.title}, measures ${section.measures[0]}–${section.measures[1]}. ${section.focus}.`);
  }, [jumpToMeasure, onFeedback, sections]);

  useEffect(() => {
    let disposed = false;
    const renderScore = async () => {
      if (!containerRef.current) return;
      setStatus("loading");
      try {
        const { OpenSheetMusicDisplay: OSMD } = await import("opensheetmusicdisplay");
        if (disposed || !containerRef.current) return;
        const osmd = new OSMD(containerRef.current, {
          autoResize: true,
          backend: "svg",
          drawingParameters: "compacttight",
          drawTitle: false,
          drawComposer: false,
          drawPartNames: false,
          followCursor: false,
        });
        osmd.setLogLevel("error");
        await osmd.load(scoreUrl);
        if (disposed) return;
        osmd.render();
        osmd.cursor.hide();
        osmdRef.current = osmd;
        setStatus("ready");
        setCurrentMeasure(1);
        setExpectedNotes(
          [...new Set(
            osmd.cursor
              .NotesUnderCursor()
              .filter((note) => !note.isRest() && note.Pitch?.Frequency)
              .map((note) => midiFromFrequency(note.Pitch.Frequency)),
          )].sort((a, b) => a - b),
        );
      } catch {
        if (!disposed) setStatus("error");
      }
    };
    renderScore();
    return () => {
      disposed = true;
      osmdRef.current?.cursor.Dispose();
      osmdRef.current = null;
    };
  }, [scoreUrl]);

  useEffect(() => {
    if (!playedNote || !following || status !== "ready") return;
    const osmd = osmdRef.current;
    if (!osmd) return;

    let expected = readExpectedNotes();
    let emptyPositionsSkipped = 0;
    while (!expected.length && !osmd.cursor.Iterator.EndReached && emptyPositionsSkipped < 12) {
      osmd.cursor.next();
      emptyPositionsSkipped += 1;
      expected = readExpectedNotes();
    }
    setExpectedNotes(expected);

    if (!expected.includes(playedNote.midi)) {
      onFeedback(
        expected.length
          ? `${nameMidi(playedNote.midi)} is not in this score position. Listen for ${expected.map(nameMidi).join(" and ")}.`
          : "The cursor is at a rest. Let the silence keep its full value.",
      );
      return;
    }

    matchedNotesRef.current.add(playedNote.midi);
    setMatchedCount(matchedNotesRef.current.size);
    const complete = expected.every((note) => matchedNotesRef.current.has(note));
    if (!complete) {
      const remaining = expected.filter((note) => !matchedNotesRef.current.has(note));
      onFeedback(`${nameMidi(playedNote.midi)} is in place. Keep holding and add ${remaining.map(nameMidi).join(" and ")}.`);
      return;
    }

    const completedMeasure = osmd.cursor.Iterator.CurrentMeasureIndex + 1;
    matchedNotesRef.current.clear();
    setMatchedCount(0);
    osmd.cursor.next();

    const nextMeasure = osmd.cursor.Iterator.CurrentMeasureIndex + 1;
    if (nextMeasure > completedMeasure) onMeasureComplete(completedMeasure);

    const section = sections[activeSectionRef.current];
    if (loopSection && nextMeasure > section.measures[1]) {
      jumpToMeasure(section.measures[0]);
      onFeedback(`${section.title} complete. Looping back to measure ${section.measures[0]} for one more musical pass.`);
      return;
    }

    updateCursorState();
    onFeedback(`Correct. The score has moved forward${nextMeasure > completedMeasure ? ` into measure ${nextMeasure}` : ""}.`);
  }, [following, jumpToMeasure, loopSection, onFeedback, onMeasureComplete, playedNote, readExpectedNotes, sections, status, updateCursorState]);

  const section = sections[activeSection];
  const sectionCompleted = Array.from(
    { length: section.measures[1] - section.measures[0] + 1 },
    (_, index) => section.measures[0] + index,
  ).filter((measure) => completedMeasures.includes(measure)).length;
  const sectionLength = section.measures[1] - section.measures[0] + 1;

  return (
    <section className="score-reader" aria-label={`Full score for ${title}`}>
      <div className="score-reader-heading">
        <div>
          <p className="eyebrow">Complete score · {composer}</p>
          <h2>{title}</h2>
        </div>
        <div className="score-reader-actions">
          <button
            className={following ? "score-follow active" : "score-follow"}
            onClick={() => {
              const next = !following;
              setFollowing(next);
              if (osmdRef.current) {
                osmdRef.current.FollowCursor = next;
                if (next) osmdRef.current.cursor.show();
                else osmdRef.current.cursor.hide();
              }
              onFeedback(next ? `Score following started at measure ${currentMeasure}. Play what the blue cursor shows.` : "Score following paused.");
            }}
            disabled={status !== "ready"}
          >
            <i /> {following ? "Following your playing" : "Follow my playing"}
          </button>
          <button className={loopSection ? "score-loop active" : "score-loop"} onClick={() => setLoopSection((value) => !value)} aria-pressed={loopSection}>↻ Loop section</button>
        </div>
      </div>

      <div className="score-sections" aria-label="Score sections">
        {sections.map((item, index) => {
          const done = Array.from({ length: item.measures[1] - item.measures[0] + 1 }, (_, offset) => item.measures[0] + offset).every((measure) => completedMeasures.includes(measure));
          return (
            <button key={item.title} className={index === activeSection ? "active" : ""} onClick={() => chooseSection(index)}>
              <span>{done ? "✓" : index + 1}</span>
              <div><strong>{item.title}</strong><small>mm. {item.measures[0]}–{item.measures[1]}</small></div>
            </button>
          );
        })}
      </div>

      <div className="score-context">
        <div><span>Current section</span><strong>{section.title}</strong></div>
        <div><span>Measure</span><strong>{currentMeasure} / {totalMeasures}</strong></div>
        <div><span>Focus</span><strong>{section.focus}</strong></div>
        <div><span>Harmony</span><strong>{section.harmony}</strong></div>
      </div>

      <div className={`score-paper ${status}`}>
        {status === "loading" && <div className="score-loading"><i /><p>Engraving the complete score…</p></div>}
        {status === "error" && <div className="score-error"><strong>The score could not be opened.</strong><p>The teaching lesson still works. Refresh once to try loading the notation again.</p></div>}
        <div ref={containerRef} className="osmd-container" />
      </div>

      <div className="score-transport">
        <button onClick={() => jumpToMeasure(Math.max(1, currentMeasure - 1))} disabled={status !== "ready" || currentMeasure <= 1}>← Previous measure</button>
        <div className="measure-progress">
          <div><i style={{ width: `${(sectionCompleted / sectionLength) * 100}%` }} /></div>
          <span>{sectionCompleted} of {sectionLength} measures heard correctly</span>
        </div>
        <div className="expected-score-notes">
          <span>{following ? "Now play" : "Cursor notes"}</span>
          <strong>{expectedNotes.length ? expectedNotes.map(nameMidi).join(" · ") : "Rest"}</strong>
          {expectedNotes.length > 1 && <small>{matchedCount}/{expectedNotes.length} held</small>}
        </div>
        <button onClick={() => jumpToMeasure(Math.min(totalMeasures, currentMeasure + 1))} disabled={status !== "ready" || currentMeasure >= totalMeasures}>Next measure →</button>
      </div>
    </section>
  );
}
