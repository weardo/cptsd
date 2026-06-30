// lib/seedResources.ts
import { connectDB } from '@cptsd/db';
import { Resource, ResourceType, ResourceCategory } from '@cptsd/db';

export async function seedInitialResources() {
  await connectDB();

  const seeds = [
    // --- HELPLINES (India) ---
    {
      type: ResourceType.HELPLINE,
      title: 'Tele-MANAS (National Tele Mental Health Programme)',
      description:
        "Government of India's free, 24x7 tele-mental health service. You can call to speak with trained mental health professionals for emotional distress, exam or work stress, anxiety, or trauma-related concerns. They can also connect you to local services.",
      phone: '14416 / 1800-89-14416',
      url: 'https://telemanas.mohfw.gov.in/',
      region: 'All India',
      languages: ['Multiple Indian languages', 'English'],
      tags: ['crisis', 'mental health', 'government'],
      isFeatured: true,
      category: ResourceCategory.EMERGENCY,
    },
    {
      type: ResourceType.HELPLINE,
      title: 'KIRAN Mental Health Rehabilitation Helpline',
      description:
        '24x7 toll-free helpline launched by the Ministry of Social Justice & Empowerment to support people facing anxiety, stress, depression, suicidal thoughts and other mental health concerns.',
      phone: '1800-599-0019',
      url: 'https://depwd.gov.in/en/others-helplines/',
      region: 'All India',
      languages: [
        'Hindi',
        'Assamese',
        'Tamil',
        'Marathi',
        'Odia',
        'Telugu',
        'Malayalam',
        'Gujarati',
        'Punjabi',
        'Kannada',
        'Bengali',
        'Urdu',
        'English',
      ],
      tags: ['crisis', 'rehabilitation', 'government'],
      isFeatured: true,
      category: ResourceCategory.EMERGENCY,
    },
    {
      type: ResourceType.HELPLINE,
      title: 'Aasra – Suicide Prevention & Counselling',
      description:
        'NGO-based helpline offering confidential emotional support for people in distress or with suicidal thoughts.',
      phone: '+91-9820466728',
      url: 'https://www.aasra.info/',
      region: 'All India (phone-based)',
      languages: [],
      tags: ['suicide prevention', 'NGO'],
      isFeatured: false,
      category: ResourceCategory.EMERGENCY,
    },
    {
      type: ResourceType.HELPLINE,
      title: 'Vandrevala Foundation Mental Health Helpline',
      description:
        '24x7 national crisis intervention and mental health helpline providing support via phone, WhatsApp and email.',
      phone: '+91-9999-666-555',
      url: 'https://www.vandrevalafoundation.com/',
      region: 'All India (phone / online)',
      languages: [],
      tags: ['crisis', 'NGO'],
      isFeatured: false,
      category: ResourceCategory.EMERGENCY,
    },

    // --- DIRECTORIES / NGOs (India-focused) ---
    {
      type: ResourceType.THERAPY_DIRECTORY,
      title: 'TheMindClan – Inclusive Therapists & Support Groups',
      description:
        'Curated directory of trauma-informed, queer-affirming, and inclusive therapists and support groups across India. Good starting point to search for trauma-aware therapists.',
      url: 'https://themindclan.com/',
      region: 'India / Indian diaspora',
      languages: [],
      tags: ['therapy', 'directory', 'inclusive'],
      isFeatured: true,
      category: ResourceCategory.THERAPY,
    },
    {
      type: ResourceType.THERAPY_DIRECTORY,
      title: 'Live Love Laugh – Therapist Directory',
      description:
        'Verified therapist directory from The Live Love Laugh Foundation. Lets you find mental health professionals across India by location and specialisation.',
      url: 'https://www.thelivelovelaughfoundation.org/find-help/therapist',
      region: 'India',
      languages: [],
      tags: ['therapy', 'directory'],
      isFeatured: true,
      category: ResourceCategory.THERAPY,
    },
    {
      type: ResourceType.NGO,
      title: 'Sangath',
      description:
        'Indian not-for-profit organisation working on community-based mental health services, research and digital mental health programs.',
      url: 'https://www.sangath.in/',
      region: 'India',
      languages: [],
      tags: ['NGO', 'community mental health'],
      isFeatured: false,
      category: ResourceCategory.SUPPORT,
    },

    // --- HELPLINE LISTS / META RESOURCES ---
    {
      type: ResourceType.HELPLINE,
      title: 'Live Love Laugh – Helpline List',
      description:
        'A curated list of free mental health helplines across India. Useful if Tele-MANAS or KIRAN lines are busy or if you prefer NGO-run lines.',
      url: 'https://www.thelivelovelaughfoundation.org/find-help/helplines',
      region: 'India',
      languages: [],
      tags: ['directory', 'helplines'],
      isFeatured: false,
      category: ResourceCategory.EMERGENCY,
    },

    // --- INTERNATIONAL EDUCATIONAL RESOURCES (psychoeducation only) ---
    {
      type: ResourceType.EDUCATIONAL_SITE,
      title: 'Mind (UK) – Complex PTSD',
      description:
        'Plain-language explanation of complex PTSD, including symptoms, examples and ideas for support. Good for understanding the condition in everyday language.',
      url: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/post-traumatic-stress-disorder-ptsd-and-complex-ptsd/complex-ptsd/',
      region: 'International (online)',
      languages: ['English'],
      tags: ['psychoeducation', 'CPTSD'],
      isFeatured: true,
      category: ResourceCategory.EDUCATION,
    },
    {
      type: ResourceType.EDUCATIONAL_SITE,
      title: 'NHS – Complex PTSD',
      description:
        'Official UK National Health Service information page on complex PTSD, including symptoms and treatment overview.',
      url: 'https://www.nhs.uk/mental-health/conditions/post-traumatic-stress-disorder-ptsd/complex/',
      region: 'International (online)',
      languages: ['English'],
      tags: ['psychoeducation', 'CPTSD'],
      isFeatured: true,
      category: ResourceCategory.EDUCATION,
    },
    {
      type: ResourceType.EDUCATIONAL_SITE,
      title: 'NHS Inform – PTSD and CPTSD Self-Help Guide',
      description:
        'Structured self-help workbook style guide for people experiencing PTSD or complex PTSD symptoms. Includes exercises and coping strategies.',
      url: 'https://www.nhsinform.scot/illnesses-and-conditions/mental-health/mental-health-self-help-guides/ptsd-and-cptsd-self-help-guide/',
      region: 'International (online)',
      languages: ['English'],
      tags: ['self-help', 'workbook'],
      isFeatured: false,
      category: ResourceCategory.EDUCATION,
    },
    {
      type: ResourceType.EDUCATIONAL_SITE,
      title: 'Cleveland Clinic – Complex PTSD (CPTSD)',
      description:
        'Medical overview of complex PTSD, including causes, symptoms and treatment options.',
      url: 'https://my.clevelandclinic.org/health/diseases/24881-cptsd-complex-ptsd',
      region: 'International (online)',
      languages: ['English'],
      tags: ['medical', 'CPTSD'],
      isFeatured: false,
      category: ResourceCategory.EDUCATION,
    },
    {
      type: ResourceType.EDUCATIONAL_SITE,
      title: 'VA National Center for PTSD – Complex PTSD',
      description:
        'Professional-level but accessible information about PTSD and complex PTSD, grounded in ICD-11 research.',
      url: 'https://www.ptsd.va.gov/understand/what/complex_ptsd.asp',
      region: 'International (online)',
      languages: ['English'],
      tags: ['research', 'PTSD', 'CPTSD'],
      isFeatured: false,
      category: ResourceCategory.EDUCATION,
    },

    // --- PEER COMMUNITIES (with strong disclaimers) ---
    {
      type: ResourceType.COMMUNITY,
      title: 'r/CPTSD – Reddit Community',
      description:
        'Large international peer-support community for people living with complex PTSD and long-term trauma. Not a replacement for therapy; conversations may be triggering for some readers.',
      url: 'https://www.reddit.com/r/CPTSD/',
      region: 'International (online)',
      languages: ['English'],
      tags: ['peer support', 'online community'],
      isFeatured: false,
      category: ResourceCategory.COMMUNITY,
    },
  ];

  let inserted = 0;
  let updated = 0;

  for (const seed of seeds) {
    const result = await Resource.updateOne(
      { title: seed.title, type: seed.type },
      { $set: { ...seed, status: 'ACTIVE' } },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      inserted++;
    } else if (result.modifiedCount > 0) {
      updated++;
    }
  }

  console.log(`✅ Seeded resources: ${inserted} inserted, ${updated} updated`);
  return { inserted, updated };
}

