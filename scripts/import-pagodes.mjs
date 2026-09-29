// Rebuild the note-focused Pagodes playing score from DCMLab's annotated
// transcription. The full first-edition scan is linked in the lesson.
import { writeFile } from "node:fs/promises";

const base = "https://raw.githubusercontent.com/DCMLab/debussy_estampes/main";
const stem = "l100-01_estampes_pagode.tsv";
const [noteText, measureText] = await Promise.all(["notes", "measures"].map(async (folder) => {
  const response = await fetch(`${base}/${folder}/${stem}`);
  if (!response.ok) throw new Error(`Could not load ${folder}: ${response.status}`);
  return response.text();
}));

function rows(tsv) {
  const [header, ...lines] = tsv.trim().split(/\r?\n/);
  const keys = header.split("\t");
  return lines.map((line) => Object.fromEntries(line.split("\t").map((value, index) => [keys[index], value])));
}

const notes = rows(noteText);
const measures = rows(measureText);
const divisions = 10080;
const xml = ['<?xml version="1.0" encoding="utf-8"?>', '<score-partwise version="4.0">',
  '<work><work-title>Pagodes</work-title></work>',
  '<movement-title>Pagodes (note-focused practice transcription)</movement-title>',
  '<identification><creator type="composer">Claude Debussy</creator>',
  '<source>DCMLab debussy_estampes, CC BY-NC-SA 4.0</source></identification>',
  '<part-list><score-part id="P1"><part-name>Piano</part-name><part-abbreviation>Pno</part-abbreviation>',
  '<score-instrument id="I1"><instrument-name>Piano</instrument-name></score-instrument></score-part></part-list>',
  '<part id="P1">'];

const types = { "1": "whole", "1/2": "half", "1/4": "quarter", "1/8": "eighth", "1/16": "16th", "1/32": "32nd" };
const unit = (quarterbeats) => Math.round(Number(quarterbeats) * divisions);
const pitch = (name) => {
  const [, step, accidentals, octave] = name.match(/^([A-G])([#b]*)(-?\d+)$/) ?? [];
  if (!step) throw new Error(`Bad pitch ${name}`);
  const alter = [...accidentals].reduce((value, sign) => value + (sign === "#" ? 1 : -1), 0);
  return `<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch>`;
};

for (const measure of measures) {
  const number = Number(measure.mc);
  const length = unit(measure.duration_qb);
  xml.push(`<measure number="${number}">`);
  if (number === 1) xml.push(`<attributes><divisions>${divisions}</divisions><key><fifths>5</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>`);
  else if (measure.timesig !== measures[number - 2].timesig) {
    const [beats, beatType] = measure.timesig.split("/");
    xml.push(`<attributes><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time></attributes>`);
  }
  const entries = notes.filter((note) => Number(note.mc) === number);
  const voiceKeys = [...new Set(entries.map((note) => `${note.staff}:${note.voice}`))].sort((a, b) => {
    const [aStaff, aVoice] = a.split(":").map(Number);
    const [bStaff, bVoice] = b.split(":").map(Number);
    return aStaff - bStaff || aVoice - bVoice;
  });
  voiceKeys.forEach((key, voiceIndex) => {
    if (voiceIndex) xml.push(`<backup><duration>${length}</duration></backup>`);
    const [staff, voice] = key.split(":").map(Number);
    const voiceNotes = entries.filter((note) => Number(note.staff) === staff && Number(note.voice) === voice);
    const groups = new Map();
    for (const note of voiceNotes) {
      const onset = unit(note.mc_onset ? Number(note.mc_onset.split("/")[0]) / Number(note.mc_onset.split("/")[1] ?? 1) * 4 : 0);
      if (!groups.has(onset)) groups.set(onset, []);
      groups.get(onset).push(note);
    }
    let elapsed = 0;
    for (const [onset, chord] of [...groups].sort(([a], [b]) => a - b)) {
      // Voice-alignment gaps are structural, not intentional visible rests.
      if (onset > elapsed) xml.push(`<note print-object="no"><rest/><duration>${onset - elapsed}</duration><voice>${staff}${voice}</voice><type>quarter</type><staff>${staff}</staff></note>`);
      for (const [index, note] of chord.entries()) {
        const duration = unit(note.duration_qb);
        const scalar = note.scalar;
        const nominal = types[note.nominal_duration];
        const [actual, normal] = scalar === "2/3" ? [3, 2] : scalar === "4/5" ? [5, 4] : [0, 0];
        const tied = note.tied === "1" ? ["start"] : note.tied === "-1" ? ["stop"] : note.tied === "0" ? ["stop", "start"] : [];
        xml.push(`<note>${index ? "<chord/>" : ""}${pitch(note.name)}<duration>${duration}</duration>${tied.map((kind) => `<tie type="${kind}"/>`).join("")}<voice>${staff}${voice}</voice><type>${nominal}</type>${scalar === "3/2" ? "<dot/>" : ""}${actual ? `<time-modification><actual-notes>${actual}</actual-notes><normal-notes>${normal}</normal-notes></time-modification>` : ""}<staff>${staff}</staff>${tied.length ? `<notations>${tied.map((kind) => `<tied type="${kind}"/>`).join("")}</notations>` : ""}</note>`);
      }
      elapsed = Math.max(elapsed, onset + unit(chord[0].duration_qb));
    }
  });
  xml.push("</measure>");
}
xml.push("</part></score-partwise>");
await writeFile(new URL("../public/scores/debussy-pagodes.musicxml", import.meta.url), xml.join("\n"));
console.log(`Wrote ${measures.length} measures, ${notes.length} noteheads`);
