import { CategorySection } from '../components/CategorySection'
import { FeaturedProducts } from '../components/FeaturedProducts'
import { Hero } from '../components/Hero'
import { NewsletterSection } from '../components/NewsletterSection'
import { ScrollFadeSection } from '../components/ScrollFadeSection'
import { TestimonialsSection } from '../components/TestimonialsSection'

export function HomePage() {
  return (
    <main aria-label="Store content">
      <ScrollFadeSection><Hero /></ScrollFadeSection>
      <ScrollFadeSection><FeaturedProducts /></ScrollFadeSection>
      <ScrollFadeSection><CategorySection /></ScrollFadeSection>
      <ScrollFadeSection><TestimonialsSection /></ScrollFadeSection>
      <ScrollFadeSection><NewsletterSection /></ScrollFadeSection>
    </main>
  )
}
