import { Metadata } from 'next'
import About from '../../views/About'

export const metadata: Metadata = {
  title: 'About Our Home Tuition | Empowering Education & Mentorship',
  description: 'Learn about Our Home Tuition mission to connect students with expert mentors. We provide personalized home tutoring from Class 1 to 10 while creating career opportunities for educators.',
  keywords: 'about our home tuition, home tutoring mission, education company, personalized learning, mentor career opportunities',
}

export default function AboutPage() {
  return <About />;
}
