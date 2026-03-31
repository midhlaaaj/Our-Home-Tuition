import { Metadata } from 'next'
import Blogs from '../../views/Blogs'

export const metadata: Metadata = {
  title: 'Educational Blogs & Learning Tips | Our Home Tuition',
  description: 'Explore the latest educational insights, pedagogical strategies, and student success stories from Our Home Tuition. Stay updated with our expert blog posts.',
  keywords: 'education blog, learning tips, tutoring insights, home tuition stories, teaching strategies',
}

export default function BlogsPage() {
  return <Blogs />;
}
