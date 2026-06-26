// This file is the single source of truth for all packages, add-ons, and prices.
// The AI prompts will receive this data, not have prices typed into their instructions.
// If a price changes, this is the only file that needs editing.

export const basePackages = {
    hospital: {
        name: "Hospital Growth Package",
        reels: 12,
        posters: 6,
        shoots: 1,
        platforms: ["Instagram", "Facebook", "YouTube", "Google My Business"],
        basePrice: 60000,
    },
    doctor: {
        name: "Doctor Personal Branding Package",
        reels: 8,
        posters: 4,
        shoots: 0,
        platforms: ["Instagram", "Facebook", "YouTube", "Google My Business"],
        basePrice: 35000,
    },
};

export const addOns = [
    {
        id: "meta_ads",
        category: "Ads",
        name: "Meta Ads Management",
        description: "Awareness, reach & profile visit campaigns on Facebook and Instagram",
        referencePrice: 6000,
        priceUnit: "per month",
    },
    {
        id: "google_ads",
        category: "Ads",
        name: "Google Ads Management",
        description: "Search ads, call campaigns, Maps visibility campaigns",
        referencePrice: 12000,
        priceUnit: "per month",
    },
    {
        id: "meta_google_ads",
        category: "Ads",
        name: "Meta + Google Ads",
        description: "Combined cross-platform awareness and traffic strategy",
        referencePrice: 15000,
        priceUnit: "per month",
    },
    {
        id: "lead_generation",
        category: "Leads",
        name: "Lead Generation",
        description: "Meta Instant Form campaigns for direct patient lead capture",
        referencePrice: null,
        priceUnit: "custom",
    },
    {
        id: "conversion_support",
        category: "Leads",
        name: "Conversion Support (LMT)",
        description: "Telecalling, follow-ups and appointment coordination by Atoms team",
        referencePrice: 15000,
        priceUnit: "per month",
    },
    {
        id: "basic_seo",
        category: "SEO",
        name: "Basic SEO",
        description: "Hospital website optimisation, local SEO, GMB improvements",
        referencePrice: 10000,
        priceUnit: "per month",
    },
    {
        id: "advanced_seo",
        category: "SEO",
        name: "Advanced SEO",
        description: "Technical SEO, competitor analysis, advanced keyword strategy",
        referencePrice: 20000,
        priceUnit: "per month",
    },
    {
        id: "website_management",
        category: "Other",
        name: "Website Management",
        description: "Updates, content uploads, minor maintenance",
        referencePrice: 5000,
        priceUnit: "per month",
    },
    {
        id: "advanced_strategy",
        category: "Other",
        name: "Advanced Strategy & Research",
        description: "Competitor observation, deep content analysis, growth recommendations",
        referencePrice: 8000,
        priceUnit: "per month",
    },
    {
        id: "extra_reel",
        category: "Other",
        name: "Extra Reel",
        description: "Additional reel beyond monthly quota",
        referencePrice: 1000,
        priceUnit: "per reel",
    },
    {
        id: "extra_poster",
        category: "Other",
        name: "Extra Poster",
        description: "Additional poster beyond monthly quota",
        referencePrice: 500,
        priceUnit: "per poster",
    },
    {
        id: "regular_shoot",
        category: "Other",
        name: "Regular Shoot (extra)",
        description: "Standard doctor content shoot, multiple recordings in one session",
        referencePrice: 5000,
        priceUnit: "flat",
    },
    {
        id: "premium_shoot",
        category: "Other",
        name: "Premium Shoot",
        description: "Multi-camera, premium lighting, advanced creative direction",
        referencePrice: 10000,
        priceUnit: "flat",
    },
];

export const doctorSpecialities = [
    "Gynaecology",
    "Orthopaedics",
    "Cardiology",
    "Neurology",
    "Paediatrics",
    "Gastroenterology",
    "General Surgery",
];

export const allPlatforms = ["Instagram", "Facebook", "YouTube", "Google My Business"];