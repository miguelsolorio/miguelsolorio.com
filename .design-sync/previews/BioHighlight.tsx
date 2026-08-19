import { BioHighlight, SiteShell } from 'miguelsolorio-ui'

export const FirstBioParagraph = () => (
  <div className="bio-copy">
    <p>
      I like <BioHighlight color="c1">making things</BioHighlight> and design is one of the ways I like expressing it.
      I enjoy <BioHighlight color="c4">ambiguous problems</BioHighlight> where the answer isn&#39;t obvious.
      I like trying <BioHighlight color="c2">new ideas</BioHighlight>, building prototypes,
      and <BioHighlight color="c3">obsessing over the details</BioHighlight> with people who care.
    </p>
  </div>
)

export const AllColors = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '1.125rem' }}>
    <BioHighlight color="c1">making things</BioHighlight>
    <BioHighlight color="c2">new ideas</BioHighlight>
    <BioHighlight color="c3">scaring myself sh*tless</BioHighlight>
    <BioHighlight color="c4">design</BioHighlight>
    <BioHighlight color="c5">doing everything</BioHighlight>
  </div>
)

export const Dark = () => (
  <SiteShell theme="dark">
    <div className="bio-copy">
      <p>
        I like <BioHighlight color="c1">making things</BioHighlight> and design is one of the ways I like expressing it.
        I enjoy <BioHighlight color="c4">ambiguous problems</BioHighlight> where the answer isn&#39;t obvious.
        I like trying <BioHighlight color="c2">new ideas</BioHighlight>, building prototypes,
        and <BioHighlight color="c3">obsessing over the details</BioHighlight> with people who care.
      </p>
    </div>
  </SiteShell>
)
