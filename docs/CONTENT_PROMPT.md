Here’s a single big prompt you can drop into Cursor (project-level or as a “do this now” instruction) to set up **cptsd-main** with real content and seed data.

I’ve included:

- Concrete copy for: Home, Start Here, Learn, Live, Support, Community, About, Terms, Privacy, Helplines.
- Seedable resources (India helplines, directories, educational sites, communities).
- Clear trauma-informed / non-medical framing.

You can edit the tone later to be more Hinglish if you want.

---

````text
You are working in the `cptsd-main` app of the monorepo github.com/weardo/cptsd.

Goal
----
Populate `cptsd-main` (the main hub at https://cptsd.in) with **real, helpful, trauma-informed content** and connect it to the shared data layer (Resources, Stories, Articles).

For now:
- We assume Articles are managed in cptsd-cms + blog.cptsd.in and may be sparse.
- We WILL still wire the main site to Articles, but the initial focus is:
  - Static content pages with strong psychoeducation and disclaimers.
  - A solid "Support" / resources page for India.
  - Story submission and community structure.

VERY IMPORTANT – tone & safety
------------------------------
All content must:

- Be trauma-informed, gentle, non-judgmental.
- Avoid graphic descriptions of abuse, self-harm, or violence.
- NOT give diagnoses or claim to replace professional care.
- Repeatedly encourage people to seek help from qualified professionals and helplines if in crisis.

Complex PTSD (CPTSD) should be described consistently with ICD-11-style definitions:

- It describes problems that can develop after **long-term or repeated trauma**, often starting in childhood (e.g., ongoing abuse, neglect, war, captivity).
- People usually have **PTSD symptoms** (re-experiencing, avoidance, feeling threatened) plus difficulties in:
  - **Affect regulation** (emotions feel too intense or shut down).
  - **Negative self-concept** (deep shame / worthlessness).
  - **Relationships** (feeling unsafe, disconnected, or stuck in unhealthy patterns).

Reference (for your understanding, not to be quoted): Mind UK, NHS, Cleveland Clinic, VA National Center for PTSD etc., describe CPTSD as PTSD plus disturbances in self-organisation: affect dysregulation, negative self-beliefs, and relational issues.

Architecture assumptions
------------------------
- There is a shared `Resource` model in a shared db package with:
  - type: "HELPLINE" | "NGO" | "THERAPY_DIRECTORY" | "COMMUNITY" | "EDUCATIONAL_SITE" | "BOOK"
  - title, description, url?, phone?, region?, languages?, tags?, isFeatured?

- `cptsd-main` will:
  - READ Resources and Stories.
  - READ Articles (if any) to show “Featured from the blog”.
  - WRITE Story submissions (status = "PENDING").

You must:
1. Create static/content pages (App Router) and use the copy provided below.
2. Implement a way to seed initial Resource data (e.g., a one-off script or admin usage).
3. Wire each page to fetch Resources and Articles as described.

Part 1 – Seed Resource data (India + international)
---------------------------------------------------
Create a small seed module, e.g. `lib/seedResources.ts`, that inserts initial resources if they do not exist. Use this shape (adjust import paths to shared models):

```ts
// lib/seedResources.ts
import { connectMongo } from "@cptsd/db/mongo";
import { ResourceModel } from "@cptsd/db/models/Resource";

export async function seedInitialResources() {
  await connectMongo();

  const seeds = [
    // --- HELPLINES (India) ---
    {
      type: "HELPLINE",
      title: "Tele-MANAS (National Tele Mental Health Programme)",
      description:
        "Government of India’s free, 24x7 tele-mental health service. You can call to speak with trained mental health professionals for emotional distress, exam or work stress, anxiety, or trauma-related concerns. They can also connect you to local services.",
      phone: "14416 / 1800-89-14416",
      url: "https://telemanas.mohfw.gov.in/",
      region: "All India",
      languages: ["Multiple Indian languages", "English"],
      tags: ["crisis", "mental health", "government"],
      isFeatured: true,
    },
    {
      type: "HELPLINE",
      title: "KIRAN Mental Health Rehabilitation Helpline",
      description:
        "24x7 toll-free helpline launched by the Ministry of Social Justice & Empowerment to support people facing anxiety, stress, depression, suicidal thoughts and other mental health concerns.",
      phone: "1800-599-0019",
      url: "https://depwd.gov.in/en/others-helplines/", // reference listing page
      region: "All India",
      languages: [
        "Hindi",
        "Assamese",
        "Tamil",
        "Marathi",
        "Odia",
        "Telugu",
        "Malayalam",
        "Gujarati",
        "Punjabi",
        "Kannada",
        "Bengali",
        "Urdu",
        "English",
      ],
      tags: ["crisis", "rehabilitation", "government"],
      isFeatured: true,
    },
    {
      type: "HELPLINE",
      title: "Aasra – Suicide Prevention & Counselling",
      description:
        "NGO-based helpline offering confidential emotional support for people in distress or with suicidal thoughts.",
      phone: "+91-9820466728",
      url: "https://www.aasra.info/",
      region: "All India (phone-based)",
      languages: [],
      tags: ["suicide prevention", "NGO"],
      isFeatured: false,
    },
    {
      type: "HELPLINE",
      title: "Vandrevala Foundation Mental Health Helpline",
      description:
        "24x7 national crisis intervention and mental health helpline providing support via phone, WhatsApp and email.",
      phone: "+91-9999-666-555",
      url: "https://www.vandrevalafoundation.com/",
      region: "All India (phone / online)",
      languages: [],
      tags: ["crisis", "NGO"],
      isFeatured: false,
    },

    // --- DIRECTORIES / NGOs (India-focused) ---
    {
      type: "THERAPY_DIRECTORY",
      title: "TheMindClan – Inclusive Therapists & Support Groups",
      description:
        "Curated directory of trauma-informed, queer-affirming, and inclusive therapists and support groups across India. Good starting point to search for trauma-aware therapists.",
      url: "https://themindclan.com/",
      region: "India / Indian diaspora",
      languages: [],
      tags: ["therapy", "directory", "inclusive"],
      isFeatured: true,
    },
    {
      type: "THERAPY_DIRECTORY",
      title: "Live Love Laugh – Therapist Directory",
      description:
        "Verified therapist directory from The Live Love Laugh Foundation. Lets you find mental health professionals across India by location and specialisation.",
      url: "https://www.thelivelovelaughfoundation.org/find-help/therapist",
      region: "India",
      languages: [],
      tags: ["therapy", "directory"],
      isFeatured: true,
    },
    {
      type: "NGO",
      title: "Sangath",
      description:
        "Indian not-for-profit organisation working on community-based mental health services, research and digital mental health programs.",
      url: "https://www.sangath.in/",
      region: "India",
      languages: [],
      tags: ["NGO", "community mental health"],
      isFeatured: false,
    },

    // --- HELPLINE LISTS / META RESOURCES ---
    {
      type: "HELPLINE",
      title: "Live Love Laugh – Helpline List",
      description:
        "A curated list of free mental health helplines across India. Useful if Tele-MANAS or KIRAN lines are busy or if you prefer NGO-run lines.",
      url: "https://www.thelivelovelaughfoundation.org/find-help/helplines",
      region: "India",
      languages: [],
      tags: ["directory", "helplines"],
      isFeatured: false,
    },

    // --- INTERNATIONAL EDUCATIONAL RESOURCES (psychoeducation only) ---
    {
      type: "EDUCATIONAL_SITE",
      title: "Mind (UK) – Complex PTSD",
      description:
        "Plain-language explanation of complex PTSD, including symptoms, examples and ideas for support. Good for understanding the condition in everyday language.",
      url: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/post-traumatic-stress-disorder-ptsd-and-complex-ptsd/complex-ptsd/",
      region: "International (online)",
      languages: ["English"],
      tags: ["psychoeducation", "CPTSD"],
      isFeatured: true,
    },
    {
      type: "EDUCATIONAL_SITE",
      title: "NHS – Complex PTSD",
      description:
        "Official UK National Health Service information page on complex PTSD, including symptoms and treatment overview.",
      url: "https://www.nhs.uk/mental-health/conditions/post-traumatic-stress-disorder-ptsd/complex/",
      region: "International (online)",
      languages: ["English"],
      tags: ["psychoeducation", "CPTSD"],
      isFeatured: true,
    },
    {
      type: "EDUCATIONAL_SITE",
      title: "NHS Inform – PTSD and CPTSD Self-Help Guide",
      description:
        "Structured self-help workbook style guide for people experiencing PTSD or complex PTSD symptoms. Includes exercises and coping strategies.",
      url: "https://www.nhsinform.scot/illnesses-and-conditions/mental-health/mental-health-self-help-guides/ptsd-and-cptsd-self-help-guide/",
      region: "International (online)",
      languages: ["English"],
      tags: ["self-help", "workbook"],
      isFeatured: false,
    },
    {
      type: "EDUCATIONAL_SITE",
      title: "Cleveland Clinic – Complex PTSD (CPTSD)",
      description:
        "Medical overview of complex PTSD, including causes, symptoms and treatment options.",
      url: "https://my.clevelandclinic.org/health/diseases/24881-cptsd-complex-ptsd",
      region: "International (online)",
      languages: ["English"],
      tags: ["medical", "CPTSD"],
      isFeatured: false,
    },
    {
      type: "EDUCATIONAL_SITE",
      title: "VA National Center for PTSD – Complex PTSD",
      description:
        "Professional-level but accessible information about PTSD and complex PTSD, grounded in ICD-11 research.",
      url: "https://www.ptsd.va.gov/understand/what/complex_ptsd.asp",
      region: "International (online)",
      languages: ["English"],
      tags: ["research", "PTSD", "CPTSD"],
      isFeatured: false,
    },

    // --- PEER COMMUNITIES (with strong disclaimers) ---
    {
      type: "COMMUNITY",
      title: "r/CPTSD – Reddit Community",
      description:
        "Large international peer-support community for people living with complex PTSD and long-term trauma. Not a replacement for therapy; conversations may be triggering for some readers.",
      url: "https://www.reddit.com/r/CPTSD/",
      region: "International (online)",
      languages: ["English"],
      tags: ["peer support", "online community"],
      isFeatured: false,
    },
  ];

  for (const seed of seeds) {
    await ResourceModel.updateOne(
      { title: seed.title, type: seed.type },
      { $set: seed },
      { upsert: true },
    );
  }
}
````

Use this seed function once (via a script or an API route guarded by an env flag) to pre-populate resources.

## Part 2 – Global layout: disclaimers & crisis banner

In `cptsd-main`, create a shared layout component that includes:

1. A **site-wide disclaimer** component (maybe in the footer) with text:

> CPTSD.in is an awareness and peer-support project.
> We share educational information about complex trauma, emotional neglect and mental health.
> We do not provide diagnosis, therapy, or emergency services.
> If you are in crisis, feeling unsafe, or thinking about harming yourself, please contact a trusted person, call a mental health helpline, or go to the nearest hospital emergency department.

2. A **crisis banner** component shown on most pages (except maybe Terms / Privacy), e.g. a slim bar:

> In crisis or feeling unsafe right now? This website cannot support emergencies.
> See Indian mental health helplines and emergency options on our Support page.

with a button linking to `/support#helplines`.

## Part 3 – Home page (`/`)

Create `app/page.tsx` with content roughly like:

- Hero section:

Title:

> Complex trauma, emotional neglect, and CPTSD — in an Indian context.

Subtitle:

> CPTSD.in is a volunteer-run space for people who grew up with long-term stress, emotional neglect, or abuse and are now trying to understand what happened to them.
> We offer psychoeducation, curated resources, and community stories. We’re not a hospital or clinic — we help you put words to your experience and find support.

CTA buttons:

- “Start here” → `/start-here`

- “Learn about CPTSD” → `/learn`

- “Get support” → `/support`

- “What is CPTSD?” summary section:

  - Short paragraph explaining:

    - Trauma can be one-time or long-term.
    - CPTSD describes the impact of long-term trauma: intrusive memories, avoidance, feeling on edge, plus long-lasting difficulties with emotions, self-worth and relationships.

  - Link to key blog article (when available) or to Mind/NHS resources via `/learn`.

- “Living with CPTSD in India” section:

  - 2–3 cards:

    - Emotional neglect in families.
    - “Log kya kahenge”, shame and pressure.
    - Burnout, study/work stress, and feeling “too sensitive” or “too numb”.

- “From the community” section:

  - Show 2–3 APPROVED Stories if available.
  - If none yet, show a placeholder encouraging anonymous story sharing via `/community`.

- “Featured reading”:

  - If any published Articles exist, show 3–4 fetched by category (BASICS, INDIA_CONTEXT etc.).
  - Each card links to blog.cptsd.in/learn/[slug].

## Part 4 – Start Here page (`/start-here`)

Implement `app/start-here/page.tsx` with structured sections and headings.

Use copy like this (you can break into components):

**Section 1 – You’re not “too weak” or “too dramatic”**

Explain:

- Many people in India grow up hearing “everyone has problems”, “forget it and move on”.
- If you lived with long-term emotional neglect, criticism, fear or chaos, your nervous system can adapt in ways that show up later as:

  - feeling constantly on edge,
  - shutting down or going numb,
  - intense shame and self-blame,
  - relationship patterns that feel stuck or chaotic.

Make it clear this is an explanation, not a diagnosis.

**Section 2 – PTSD vs Complex PTSD (CPTSD)**

Short, simple distinction:

- PTSD often follows a **single or few traumatic events** (accident, assault, disaster).
- CPTSD is more often linked to **long-term, repeated trauma**, especially starting in childhood (e.g. chronic abuse, neglect, exposure to violence, captivity, war, institutional trauma).
- In CPTSD, people typically experience:

  - PTSD-type symptoms (flashbacks, nightmares, avoiding reminders, feeling constantly threatened).
  - PLUS difficulties with:

    - emotions (too much / too little),
    - self-worth (deep shame, “I am broken/bad”),
    - relationships (difficulty trusting, feeling safe, or keeping stable connections).

Always emphasise: only a trained professional can give a formal diagnosis; reading about CPTSD is about understanding patterns, not labelling yourself.

**Section 3 – “Does this sound familiar?” (reflection, not diagnosis)**

Offer optional reflection bullet points like:

- “I often feel like I’m still that scared child, even though I’m an adult.”
- “I minimise what happened to me because ‘others had it worse’, but my body reacts strongly anyway.”
- “When someone is kind to me, I don’t know how to receive it or I feel suspicious.”
- “I swing between feeling too much and feeling nothing.”

Invite users to treat these as prompts, not a checklist.

**Section 4 – Where to go next**

- “Learn more about CPTSD” → link to `/learn` (and indirectly to blog articles or external resources).
- “Explore daily-life topics” → `/live`.
- “If you feel overwhelmed or unsafe” → `/support#helplines`.

## Part 5 – Learn page (`/learn`)

This page is a **category index**, not a full article listing.

Implement:

- Introduction:

> “Learn” is our library of content about complex trauma and CPTSD.
> We are slowly building India-focused articles and linking to high-quality international resources.

- Category cards:

  - **Basics** – definitions, symptoms, concepts.
  - **India context** – family culture, emotional neglect, caste/class, gender roles.
  - **Daily life** – work, studies, friendships, emotions.
  - **Healing & therapy** – therapy options, grounding, safety, boundaries.
  - **Relationships** – attachment, trust, dating, family.

For each card:

- Show 1–3 internal Article links if available (blog articles).
- If Articles are not ready yet, show:

  - 1–2 external resources from Resource.type = EDUCATIONAL_SITE (e.g. Mind, NHS, Cleveland Clinic).

- Use small disclaimers: “External link – may use non-Indian examples, still useful for concepts.”

## Part 6 – Live page (`/live`)

This page is for **day-to-day life with CPTSD traits**.

Sections to implement:

1. **Feeling numb or “too sensitive”**

- Explain emotional numbing vs overwhelm in simple terms.
- Emphasise that both are valid survival responses.
- Provide 3–5 very small, low-demand practices, e.g.:

  - noticing feet on the floor,
  - naming 3 things you can see around you,
  - gentle stretching, etc.

- Encourage readers to pause if anything feels too much.

2. **People-pleasing and fawning**

- Explain how always saying “yes”, over-apologising, or trying to keep everyone happy can be a trauma response.
- Mention Indian context: being “accommodating”, “sanskaari”, “good child”.
- Suggest micro-boundaries (e.g. delaying answer, saying “I’ll think about it”).

3. **Work, studies and burnout**

- Describe common patterns:

  - overworking + perfectionism,
  - freezing + procrastination + shame spirals.

- Offer small reframes:

  - breaking tasks into smaller steps,
  - realistic “good enough” goals,
  - prioritising rest as a form of recovery.

4. **Body and health**

- Briefly mention:

  - sleep issues,
  - digestion issues,
  - chronic pain, fatigue.

- Encourage readers to seek medical evaluation; do NOT dismiss physical symptoms as “just trauma”.
- Emphasise that mental and physical health are connected.

Each section can link to relevant blog articles later.

## Part 7 – Support page (`/support`)

This is a central, practical page.

Sections:

1. **Top disclaimer**

> This page lists support options that may help you if you are struggling.
> We do not run any helplines, NGOs, or therapy services ourselves.
> Information can change, so please always check the official website or number before relying on it.

2. **Emergency note**

> If you or someone near you is in immediate danger, or has taken steps to harm themselves, please:
>
> - Call local emergency services (for many parts of India, that’s 112), or
> - Go to the nearest hospital emergency department, or
> - Ask a trusted person to help you reach medical care.

3. **Helplines (India)** – use Resource type=HELPLINE

Render featured helplines (Tele-MANAS, KIRAN) at the top with big cards:

- Tele-MANAS card:

  - Numbers: **14416** / **1800-89-14416**
  - Short explanation about 24x7 mental health support, multiple languages, government-run.

- KIRAN card:

  - Number: **1800-599-0019**
  - Explanation about 24x7 rehab and support helpline.

Then, list other helplines (Aasra, Vandrevala, etc.) in a grid or table with icons.

4. **Find a therapist or support group (India)**

Use Resource type=THERAPY_DIRECTORY / NGO:

- TheMindClan
- Live Love Laugh therapist directory
- Sangath, etc.

Explain clearly:

> We cannot vet individual therapists. These directories are maintained by their own organisations.
> When you reach out, you can ask therapists directly about their experience with trauma and complex trauma.

5. **International psychoeducation**

Use EDUCATIONAL_SITE resources to show a list like:

- Mind – Complex PTSD explainer.
- NHS – Complex PTSD.
- NHS Inform self-help workbook.
- Cleveland Clinic CPTSD page.
- VA National Center for PTSD – Complex PTSD.

Add note:

> These sites are not India-specific, but they explain CPTSD in clear language and can help you understand the concepts.

6. **Online communities**

Use COMMUNITY resources:

- r/CPTSD etc.

Add a clear **trigger warning** style note:

> Peer communities can be validating, but they may also contain distressing or triggering content.
> They are not a replacement for therapy or crisis services.

## Part 8 – Community page (`/community`)

Purpose: explain the **CPTSD.in community ethos** and how stories work.

Sections:

1. **Why stories matter**

- Short explanation that hearing other people’s experiences can break isolation and shame, but no one is required to share.
- CPTSD.in will host **anonymised, moderated stories**.

2. **What this community is / is not**

- “Is”:

  - A place for gentle validation, normalising trauma responses, and sharing recovery moments.

- “Is not”:

  - Crisis counselling,
  - A place to diagnose others,
  - A replacement for therapy.

3. **Community guidelines**

Bullet points:

- Be kind; avoid shaming, blaming, or identity-based attacks.
- No graphic details of violence, abuse or self-harm.
- Don’t give prescriptive medical advice (“stop your meds”, “don’t trust psychiatrists”).
- You can talk about therapy experiences, but not promote or defame specific individuals.
- Respect anonymity; don’t try to identify people from their stories.

4. **Call to action**

- Button: “Read stories” → `/stories`
- Button: “Share your story anonymously” → `/stories/submit`
- Optional: Buttons to external communities (WhatsApp/Telegram/Insta) if they exist, configured via env or Resource entries.

## Part 9 – Stories list & detail (`/stories`, `/stories/[id]`, `/stories/submit`)

- `/stories`:

  - Fetch Story where status="APPROVED".
  - Show cards: title or first line, pseudonym, short excerpt, “Read more”.

- `/stories/[id]`:

  - Show pseudonym, optional title, body, createdAt.
  - Show small reminder:

> These are personal experiences shared by community members.
> They may resonate with you or not; either way, they are not professional advice, and they do not replace therapy or crisis support.

- `/stories/submit`:

  - Form fields:

    - `pseudonym` (input, required),
    - `title` (optional),
    - `body` (textarea, required, with max length),
    - Two required checkboxes:

      - “I understand this is not therapy or crisis support.”
      - “I agree to the community guidelines.”

  - On submit: create Story with status="PENDING" using shared Story model.

## Part 10 – About page (`/about`)

Content structure:

1. **Who we are**

> CPTSD.in is a volunteer-run digital project.
> Our goal is to make information about complex trauma, emotional neglect, and CPTSD more accessible in an Indian context.

2. **What we do**

- Summarise:

  - Curating Indian and international resources about CPTSD.
  - Publishing psychoeducational articles (via blog.cptsd.in).
  - Hosting anonymised community stories.
  - Highlighting support pathways (helplines, directories, NGOs).

3. **What we cannot do**

- Not a clinic or hospital.
- No diagnosis, prescriptions, or emergency intervention.
- No guarantee about any external resource; encourage people to do their own checks.

4. **Our values**

- Trauma-informed, consent-focused, inclusive.
- Open to people of all genders, castes, classes, religions, and backgrounds.
- Committed to reducing shame and stigma around trauma and mental health.

## Part 11 – Terms & Conditions (`/terms`) and Privacy Policy (`/privacy`)

Create **simple, non-legal-advice** templates (make it clear they should be reviewed by a lawyer before launch).

**Terms (key points):**

- Use of the website is voluntary; content is for informational purposes only.
- CPTSD.in does not provide medical, psychiatric, psychological, or legal services.
- External links are for convenience; CPTSD.in is not responsible for content, availability, or quality of services provided by external sites or helplines.
- Users should not post identifying information in community stories.
- CPTSD.in reserves the right to remove content (stories, comments etc.) that breaks guidelines or local laws.

**Privacy (key points):**

- Explain what is stored:

  - Basic site analytics (if any, e.g. anonymised logs).
  - Story submissions: pseudonym + story text; no requirement to share full name, phone, or address.

- Commit to:

  - Not selling personal data.
  - Only using submissions to display anonymised stories and improve the site.

- Note:

  - Email or contact forms (if any) should mention that they are not monitored for emergencies.
  - Standard cookie / analytics sections if you use tools like Vercel Analytics, Plausible, etc.

Make sure these pages:

- Are linked in the footer.
- Reiterate that no emergency/crisis support is provided via the site.

## Part 12 – Wiring to Articles (blog) – minimal for now

Even if there are few Articles yet:

- Implement helper functions in `cptsd-main` to fetch a handful of `Article` documents from Mongo (via shared models):

  - e.g. latest 5, or by category.

- On:

  - `/` – show “Featured reading” if any.
  - `/learn` – show at least some article titles under each category card when available.
  - `/live` – link relevant articles into clusters when available.

Build URLs as `BLOG_BASE_URL + "/learn/" + article.slug` via env.

## Implementation priority

1. Implement shared layout (header/footer, crisis banner, disclaimer).
2. Implement `/support` using Resources from seeded DB.
3. Implement `/start-here`, `/learn`, `/live`, `/community`, `/about`, `/terms`, `/privacy` using the copy above.
4. Implement Stories routes (`/stories`, `/stories/[id]`, `/stories/submit`) wired to shared Story model.
5. Implement Article-aware sections (`/` and `/learn`), tolerant of zero articles.
6. Add a one-off seed path to run `seedInitialResources()`.

The result should be:

- A live CPTSD.in hub that already feels complete and useful **even before** many blog articles exist.
- Strongly grounded in Indian support options and high-quality international psychoeducation.
- Consistent in safety messaging and boundaries.

```

---

This prompt already includes the researched data (helplines, directories, educational links) and page copy.

You can now paste it into Cursor, run it against `cptsd-main`, and adjust wording/length later if you want it more Hinglish or more minimal.
```
