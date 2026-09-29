# Public-domain score sources

The MusicXML files in this folder come from the [MuseTrainer public-domain MusicXML library](https://github.com/musetrainer/library):

- `ode-to-joy.mxl`: Beethoven, *Ode to Joy*, easy piano variation.
- `bach-prelude-c.mxl`: J. S. Bach, *Prelude I in C major*, BWV 846.
- `minuet-in-g.mxl`: C. Petzold, *Minuet in G major*, BWV Anh. 114.
- `gymnopedie-no-1.mxl`: Erik Satie, *Gymnopédie No. 1*.
- `chopin-prelude-e-minor.mxl`: Frédéric Chopin, *Prelude in E minor*, Op. 28 No. 4.
- `debussy-clair-de-lune.mxl`: Claude Debussy, *Suite bergamasque*, III. *Clair de lune* (72 measures). The [library transcription](https://github.com/musetrainer/library/blob/master/scores/Clair_de_Lune__Debussy.mxl) identifies [its source](https://musescore.com/user/19710/scores/58553). Compare with the [historical edition](https://imslp.org/wiki/Suite_bergamasque_(Debussy%2C_Claude)).

The compositions and source transcriptions are identified by the source library as public domain. The original download filenames and source repository history remain available in the linked library.

`debussy-pagodes.musicxml` is a note-focused practice transcription mechanically generated from the [DCMLab Estampes corpus](https://github.com/DCMLab/debussy_estampes), by DCMLab and contributors, licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Changes: converted the annotated note and measure tables into two-staff MusicXML; expressive marks, beams, and the original engraving are not reproduced. The [1903 first-edition scan](https://imslp.org/wiki/Estampes_(Debussy%2C_Claude)) is linked in the lesson for comparison. Rebuild with `node scripts/import-pagodes.mjs`.
