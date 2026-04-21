import type { Metadata } from "next";
import Script from "next/script";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { RoleBasedAuthProvider } from "../context/RoleBasedAuthProvider";
import { ModalProvider } from "../context/ModalContext";
import { CurriculumProvider } from "../context/CurriculumContext";
import AIChatButton from "../components/AIChatButton";
import ScrollToTop from "../components/ScrollToTop";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-urbanist",
});

export const metadata: Metadata = {
  title: "Our Home Tuition | Personalized Home & Online Tutoring Services",
  description: "Expert home tutors and online classes for K-12, engineering, and competitive exams. Professional, personalized, and result-oriented tutoring at your doorstep.",
  keywords: "home tuition, online tutoring, engineering tution, K-12 education, test preparation, private tutors, India",
  authors: [{ name: "Our Home Tuition" }],
  openGraph: {
    title: "Our Home Tuition | Personalized Home & Online Tutoring Services",
    description: "Quality home and online tutoring for students of all levels.",
    url: "https://our-home-tuition.vercel.app",
    siteName: "Our Home Tuition",
    images: [
      {
        url: "/icon.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Home Tuition | Personalized Home & Online Tutoring Services",
    description: "Quality home and online tutoring for students of all levels.",
    images: ["/icon.png"],
  },
  alternates: {
    canonical: "https://our-home-tuition.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${urbanist.variable} h-full antialiased`}>
      <head>
        <Script id="structured-data" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Our Home Tuition",
            "image": "https://our-home-tuition.vercel.app/icon.png",
            "@id": "https://our-home-tuition.vercel.app",
            "url": "https://our-home-tuition.vercel.app",
            "telephone": "+918075306634",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Nazeer Building",
              "addressLocality": "Trivandrum",
              "addressRegion": "Kerala",
              "postalCode": "695582",
              "addressCountry": "IN"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 8.4418,
              "longitude": 76.9961
            },
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
              ],
              "opens": "00:00",
              "closes": "23:59"
            } 
          })}
        </Script>
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <RoleBasedAuthProvider>
          <CurriculumProvider>
            <ModalProvider>
              <ScrollToTop />
              {children}
              <AIChatButton />
            </ModalProvider>
          </CurriculumProvider>
        </RoleBasedAuthProvider>
      </body>
    </html>
  );
}
