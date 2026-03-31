import { Metadata, ResolvingMetadata } from 'next'
import { supabase } from '../../../supabaseClient'
import BlogDetail from '../../../views/BlogDetail'

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug
 
  const { data: blog } = await supabase
    .from('blogs')
    .select('title, excerpt, image_url')
    .eq('slug', slug)
    .single()
 
  if (!blog) {
    return {
      title: 'Blog Not Found | Our Home Tuition',
    }
  }

  const previousImages = (await parent).openGraph?.images || []
 
  return {
    title: `${blog.title} | Our Home Tuition Blog`,
    description: blog.excerpt || 'Read our latest blog post on Our Home Tuition.',
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: blog.image_url ? [blog.image_url, ...previousImages] : previousImages,
    },
    twitter: {
        card: "summary_large_image",
        title: blog.title,
        description: blog.excerpt,
        images: blog.image_url ? [blog.image_url] : [],
    }
  }
}

export default function BlogRoute() {
  return <BlogDetail />;
}
