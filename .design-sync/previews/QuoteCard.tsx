import { QuoteCard, SiteShell } from 'miguelsolorio-ui'

export const TwitterQuote = () => (
  <QuoteCard name="Santiago" handle="@svpino" source="twitter">
    I started using the Gemini CLI today, and <mark>I don’t want to go to sleep.</mark>
  </QuoteCard>
)

export const HackerNewsQuote = () => (
  <QuoteCard name="asadm" source="hackernews">
    I have been using this for about a month and <mark>it's a beast</mark>
  </QuoteCard>
)

export const DarkTwitterQuote = () => (
  <SiteShell theme="dark">
    <QuoteCard name="Santiago" handle="@svpino" source="twitter">
      I started using the Gemini CLI today, and <mark>I don’t want to go to sleep.</mark>
    </QuoteCard>
  </SiteShell>
)
