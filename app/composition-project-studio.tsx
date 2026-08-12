"use client";

import { useMemo, useState } from "react";
import type { EditableSketch, PerformanceNote } from "./composition-workbench";
import { analyzeProject, assembleProject, PROJECT_BRIEFS, PROJECT_TRANSFORMS, recommendedBrief } from "./composition-project-engine.mjs";

export type ProjectSection = {
  id: string;
  label: string;
  name: string;
  role: string;
  sourceSketchId: string;
  transformation: string;
  harmony: string;
  texture: string;
  dynamic: "Hold" | "Build" | "Release";
  bars: number;
  reflection: string;
};

export type CompositionProject = {
  id: string;
  title: string;
  briefId: string;
  intention: string;
  tempo: number;
  createdAt: string;
  updatedAt: string;
  sections: ProjectSection[];
  arrangement: { bass: string; harmony: string; focal: string; space: string };
  revisions: Array<{ at: string; summary: string }>;
};

type Props = {
  project: CompositionProject;
  sketches: EditableSketch[];
  preferences: string[];
  onUpdate: (project: CompositionProject) => void;
  onClose: () => void;
  onPlay: (performance: PerformanceNote[]) => void;
  onCreateSketch: (sketch: EditableSketch) => void;
};

const SECTION_ROLES = [
  { label: "A", name: "Identity", role: "Teach the listener the motif and its home." },
  { label: "A′", name: "Development", role: "Keep the identity while changing one audible property." },
  { label: "B", name: "Contrast", role: "Create a different condition that makes return meaningful." },
  { label: "A", name: "Return", role: "Recall the opening after the listener has heard change." },
];

function arrangementFor(preferences: string[]) {
  if (preferences.includes("Film & game music")) return { bass: "Low piano or cello carries structural roots", harmony: "Warm strings widen only after A", focal: "Intimate piano motif remains recognizable", space: "One scoring-stage reverb, longer in B" };
  if (preferences.includes("Ambient")) return { bass: "Sparse low bloom, never continuous", harmony: "Shared-tone pad changes slowly", focal: "Felt piano appears and disappears", space: "Decay and silence mark section boundaries" };
  if (preferences.includes("Songwriting")) return { bass: "Roots clarify the form without doubling every rhythm", harmony: "Midrange accompaniment leaves room for a voice", focal: "Melody rises into its hook register", space: "Short plate grows only at the section lift" };
  return { bass: "Lowest structural notes, rhythm simplified", harmony: "Close inner voices, widened only for contrast", focal: "The clearest version of the motif", space: "One shared room, automated by section" };
}

export function createCompositionProject(sourceSketchId: string | undefined, preferences: string[]): CompositionProject {
  const now = new Date().toISOString();
  const brief = recommendedBrief(preferences);
  const source = sourceSketchId || "starter-motif";
  return {
    id: `project-${Date.now()}`,
    title: brief.title,
    briefId: brief.id,
    intention: brief.question,
    tempo: brief.id === "ambient-study" ? 62 : brief.id === "production-sketch" ? 88 : 76,
    createdAt: now,
    updatedAt: now,
    sections: SECTION_ROLES.map((section, index) => ({
      id: `section-${index + 1}`,
      ...section,
      sourceSketchId: source,
      transformation: index === 3 ? "return" : "original",
      harmony: brief.defaults.harmonies[index],
      texture: brief.defaults.textures[index],
      dynamic: index === 1 ? "Build" : index === 3 ? "Release" : "Hold",
      bars: 4,
      reflection: "",
    })),
    arrangement: arrangementFor(preferences),
    revisions: [],
  };
}

function sourceKind(sketch?: EditableSketch) {
  if (!sketch) return "Built-in motif";
  if (sketch.course === "harmony-lab") return "Harmony progression";
  if (sketch.course.includes("improv")) return "Improvised phrase";
  return "Piano sketch";
}

function transformExplanation(id: string) {
  return PROJECT_TRANSFORMS.find((item) => item.id === id)?.explanation ?? PROJECT_TRANSFORMS[0].explanation;
}

export function CompositionProjectStudio({ project, sketches, preferences, onUpdate, onClose, onPlay, onCreateSketch }: Props) {
  const [activeSection, setActiveSection] = useState(0);
  const [revisionNote, setRevisionNote] = useState("");
  const brief = PROJECT_BRIEFS.find((item) => item.id === project.briefId) ?? PROJECT_BRIEFS[0];
  const section = project.sections[activeSection];
  const analysis = useMemo(() => analyzeProject(project), [project]);
  const performance = useMemo(() => assembleProject(project, sketches) as PerformanceNote[], [project, sketches]);
  const source = sketches.find((item) => item.id === section.sourceSketchId);
  const totalBars = project.sections.reduce((sum, item) => sum + item.bars, 0);

  const update = (changes: Partial<CompositionProject>) => onUpdate({ ...project, ...changes, updatedAt: new Date().toISOString() });
  const updateSection = (changes: Partial<ProjectSection>) => update({ sections: project.sections.map((item, index) => index === activeSection ? { ...item, ...changes } : item) });

  const changeBrief = (briefId: string) => {
    const next = PROJECT_BRIEFS.find((item) => item.id === briefId) ?? PROJECT_BRIEFS[0];
    update({
      briefId,
      intention: next.question,
      sections: project.sections.map((item, index) => ({ ...item, harmony: next.defaults.harmonies[index], texture: next.defaults.textures[index] })),
    });
  };

  const recordRevision = () => {
    if (revisionNote.trim().length < 4) return;
    update({ revisions: [{ at: new Date().toISOString(), summary: revisionNote.trim() }, ...project.revisions].slice(0, 20) });
    setRevisionNote("");
  };

  const createRehearsalSketch = () => {
    if (!performance.length) return;
    const duration = Math.max(...performance.map((note) => note.start + note.duration));
    onCreateSketch({
      id: `project-sketch-${Date.now()}`,
      title: `${project.title}, rehearsal draft`,
      course: "composition-project",
      createdAt: new Date().toISOString(),
      notes: performance.map((note) => note.midi),
      duration: Math.round(duration / 1000),
      prompt: `${brief.goal} Source project: ${project.title}.`,
      performance,
      tempo: project.tempo,
    });
  };

  return (
    <section className="project-studio">
      <div className="project-topbar">
        <button className="rail-back" onClick={onClose}>← Sketchbook</button>
        <span>Saved locally · {totalBars} bars · {project.tempo} BPM</span>
        <div><button className="secondary-button" onClick={() => onPlay(performance)}>▶ Preview complete form</button><button className="primary-button" onClick={createRehearsalSketch}>Create rehearsal sketch →</button></div>
      </div>

      <header className="project-heading">
        <div>
          <p className="eyebrow">Composition project</p>
          <input value={project.title} onChange={(event) => update({ title: event.target.value })} aria-label="Project title" />
          <p>{brief.goal}</p>
        </div>
        <label><span>Project brief</span><select value={project.briefId} onChange={(event) => changeBrief(event.target.value)}>{PROJECT_BRIEFS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><small>Chosen from your directions: {preferences.join(", ")}.</small></label>
      </header>

      <section className="form-map" aria-label="Composition form">
        <div className="form-map-intro"><span>Form</span><strong>Identity must survive change.</strong></div>
        {project.sections.map((item, index) => (
          <button key={item.id} className={activeSection === index ? "active" : ""} onClick={() => setActiveSection(index)} aria-pressed={activeSection === index}>
            <span>{item.label} · {item.bars} bars</span><strong>{item.name}</strong><small>{PROJECT_TRANSFORMS.find((choice) => choice.id === item.transformation)?.label}</small>
          </button>
        ))}
      </section>

      <div className="project-workspace">
        <main className="section-editor">
          <div className="section-editor-heading"><div><p className="eyebrow">Section {activeSection + 1} of 4</p><h2>{section.label}: {section.name}</h2><p>{section.role}</p></div><label><span>Length</span><select value={section.bars} onChange={(event) => updateSection({ bars: Number(event.target.value) })}><option value={4}>4 bars</option><option value={8}>8 bars</option></select></label></div>

          <div className="project-fields">
            <label className="project-source"><span>1 · Source material</span><select value={section.sourceSketchId} onChange={(event) => updateSection({ sourceSketchId: event.target.value })}><option value="starter-motif">Built-in C–D–E–G motif</option>{sketches.map((sketch) => <option key={sketch.id} value={sketch.id}>{sketch.title}</option>)}</select><small>{sourceKind(source)}{source ? ` · ${source.notes.length} captured notes · ${source.tempo ?? project.tempo} BPM` : " · six notes · deliberately plain"}</small></label>

            <fieldset className="transform-choices"><legend>2 · Development method</legend>{PROJECT_TRANSFORMS.map((choice) => <button type="button" key={choice.id} className={section.transformation === choice.id ? "active" : ""} onClick={() => updateSection({ transformation: choice.id })} aria-pressed={section.transformation === choice.id}><strong>{choice.label}</strong><small>{choice.id === "original" ? "No structural change" : choice.id === "return" ? "Memory plus closure" : "One property changes"}</small></button>)}</fieldset>

            <div className="why-transform"><span>Why this works</span><p>{transformExplanation(section.transformation)}</p><button className="quiet-button" onClick={() => onPlay(assembleProject({ ...project, sections: [section] }, sketches))}>Hear this section</button></div>

            <div className="section-plan-grid">
              <label><span>3 · Harmonic job</span><textarea rows={3} value={section.harmony} onChange={(event) => updateSection({ harmony: event.target.value })} /><small>Name function before chord symbols: home, departure, tension, or release.</small></label>
              <label><span>4 · Texture and focal role</span><textarea rows={3} value={section.texture} onChange={(event) => updateSection({ texture: event.target.value })} /><small>Say which voice owns attention and what remains supporting.</small></label>
              <label><span>5 · Dynamic direction</span><select value={section.dynamic} onChange={(event) => updateSection({ dynamic: event.target.value as ProjectSection["dynamic"] })}><option>Hold</option><option>Build</option><option>Release</option></select><small>Dynamics define a destination, not decoration on every note.</small></label>
            </div>

            <label className="listening-note"><span>Listening evidence</span><textarea rows={3} placeholder="After previewing: what changes emotionally here, and which musical choice caused it?" value={section.reflection} onChange={(event) => updateSection({ reflection: event.target.value })} /><small>This turns a preference into a revision you can test.</small></label>
          </div>
        </main>

        <aside className="project-coach">
          <p className="eyebrow">Form teacher</p>
          <h2>{analysis.completed} of {analysis.total} structural decisions are evidenced</h2>
          <div className="project-progress"><i style={{ width: `${(analysis.completed / analysis.total) * 100}%` }} /></div>
          <p>{analysis.observation}</p>
          <div className="next-revision"><span>Next revision</span><strong>{analysis.nextMove}</strong></div>
          <ol>
            <li className={analysis.sourceChosen ? "done" : ""}>A has a musical seed</li>
            <li className={analysis.developed ? "done" : ""}>A′ changes one property</li>
            <li className={analysis.contrasted ? "done" : ""}>B creates audible contrast</li>
            <li className={analysis.returned ? "done" : ""}>The return recalls A</li>
            <li className={analysis.arranged ? "done" : ""}>Every section has a role</li>
            <li className={analysis.reflected >= 2 ? "done" : ""}>Two listening notes recorded</li>
          </ol>
          <div className="brief-question"><span>Governing question</span><p>{project.intention}</p></div>
        </aside>
      </div>

      <section className="arrangement-plan">
        <div className="arrangement-heading"><div><p className="eyebrow">Arrangement map</p><h2>Separate musical function from instrument choice.</h2></div><p>These defaults reflect {brief.direction.toLowerCase()}. Change them when your listening gives you a reason.</p></div>
        <div className="arrangement-roles">
          {(["bass", "harmony", "focal", "space"] as const).map((role, index) => <label key={role}><span>0{index + 1} · {role === "focal" ? "Focal voice" : role[0].toUpperCase() + role.slice(1)}</span><textarea rows={3} value={project.arrangement[role]} onChange={(event) => update({ arrangement: { ...project.arrangement, [role]: event.target.value } })} /></label>)}
        </div>
      </section>

      <section className="revision-ledger">
        <div><p className="eyebrow">Revision ledger</p><h2>Record decisions, not versions.</h2><p>A useful note names what you heard, what you changed, and what you expect to improve.</p></div>
        <div className="revision-entry"><textarea rows={3} value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} placeholder="B felt disconnected, so I kept A's rhythm under the new harmony. The return should now feel earned." /><button className="primary-button" disabled={revisionNote.trim().length < 4} onClick={recordRevision}>Record revision</button></div>
        <div className="revision-history">{project.revisions.length ? project.revisions.map((revision, index) => <article key={`${revision.at}-${index}`}><time>{new Date(revision.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time><p>{revision.summary}</p></article>) : <p>No revision evidence yet. Preview the form before adding the first note.</p>}</div>
      </section>
    </section>
  );
}
