import React from 'react';
import IntroWrapper from '../views/IntroPage';
import Home from '../views/Home';
import { supabase } from '../supabaseClient';

export default async function LandingPage() {
  // Fetch hero data on the server for instant loading
  const { data: heroData } = await supabase
    .from('sliders')
    .select('media_url, type, title, subtitle')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (
    <IntroWrapper>
      <Home initialHeroData={heroData || undefined} />
    </IntroWrapper>
  );
}
