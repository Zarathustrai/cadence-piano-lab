import { writeFile } from "node:fs/promises";
import { TWIN_PEAKS_STUDIES } from "../app/twin-peaks-studies.mjs";

const pitches = [["C", 0], ["C", 1], ["D", 0], ["E", -1], ["E", 0], ["F", 0], ["F", 1], ["G", 0], ["A", -1], ["A", 0], ["B", -1], ["B", 0]];
function chord(notes, staff) {
  return notes.map((midi, index) => {
    const [step, alter] = pitches[midi % 12];
    return `<note>${index ? "<chord/>" : ""}<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${Math.floor(midi / 12) - 1}</octave></pitch><duration>16</duration><voice>${staff}</voice><type>whole</type><staff>${staff}</staff></note>`;
  }).join("\n");
}
for (const study of TWIN_PEAKS_STUDIES) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
<work><work-title>${study.title} — original Cadence study</work-title></work>
<identification><creator type="composer">Cadence</creator><rights>Original preparatory exercise; not a transcription of Twin Peaks music.</rights></identification>
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
<part id="P1">
${study.bars.map((bar, index) => `<measure number="${index + 1}">
${index === 0 ? `<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes><direction><direction-type><words>Slowly, with space</words></direction-type><sound tempo="${study.bpm}"/></direction>` : ""}
${chord(bar.right, 1)}<backup><duration>16</duration></backup>${chord(bar.left, 2)}
</measure>`).join("\n")}
</part></score-partwise>`;
  await writeFile(new URL(`../public/scores/${study.id}.musicxml`, import.meta.url), xml);
  console.log(`${study.id}: ${study.bars.length} measures`);
}
