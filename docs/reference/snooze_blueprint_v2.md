# Snooze v2 — Product Requirement Document & Architecture Blueprint
## Async, vernacular, human-in-the-loop mental-health infrastructure — sold to the people already paying for the problem

> Rebuilt by running the original blueprint through Michael Skok's **Startup Secrets** framework stack (`docs/startup-secrets-cheatsheet.md`). Every major section names the framework it applies. The full critique that motivates each change is in `docs/snooze_360_teardown.md`. The original `snooze_mental_health_blueprint.md` is left intact for reference.
>
> **What changed from v1, in one line:** the product mechanics survive almost unchanged (they were good); the *strategy* around them is rebuilt — **B2B2C** distribution, a **deliberately engineered moat**, **retention as the headline metric**, **honest unit economics**, and a **clinical-risk register**.

---

## 0 · The one-line strategy

> *Cheatsheet §1 (BLAC pacing) + §2 (Build Pull, not Push).*

**The person who needs help has the least energy to ask for it — so don't make them buy.** Sell to the employers, insurers, and institutions who are *already* silently paying for untreated burnout (in attrition, absenteeism, and claims), and deliver care to their people on the one interface they already live in: **WhatsApp.** Keep the AI doing the listening at scale, and humans doing the caring where it counts.

We do **not** sell a chatbot (commoditized). We sell **the accumulated, vernacular emotional record of a person over time, plus a human one message away** — and we sell *access to that* to the buyer with a Blatant + Critical need.

---

## 1 · Founder–Market & "Why now" — DEBT-Timing

> *Cheatsheet §1 (Founder–Market Fit) + §1 (DEBT-Timing).*

**Why now (defensible):** LLM inference cost collapse (vernacular triage at fractions of a paisa) **+** WhatsApp ubiquity in India **+** post-COVID destigmatization **+** the **DPDP Act 2023** forcing every incumbent to professionalize health-data handling (a compliance bar that *favors* a clean-sheet, compliance-native entrant).

**Pacing read:** in pure B2C we are *pushing*, not being pulled (the problem is Latent + Aspirational for individuals). B2B2C is the correct **pace** — the buyer with the Critical need pulls the product into their people.

---

## 2 · The wedge (MVS) — one segment, one need

> *Cheatsheet §1 (MVS) + §9 ("fear of focus" is a top-3 founder-killer).*

**Minimum Viable Segment:**
> **Urban knowledge workers, 25–35, in metro / Tier-1 India, experiencing work-driven burnout — reached *through their employer*.**

One psychographic, one dominant stressor (work), price-insensitive *because the employer pays*, reachable in bulk through an HR contract, and **emotionally Hinglish** (this resolves v1's contradiction: scripts were English while the doc claimed "vernacular" — v2 commits to **Hinglish-first, with full vernacular as a fast-follow**).

*Adjacent expansions (not the beachhead):* students (exam/career anxiety, via universities), acute-life-event cohorts (breakup, relocation, new parents), and direct-B2C as a brand funnel beneath the B2B engine.

### MVS through the framework tests

| Test | Verdict for the *employer-bought* MVS |
|---|---|
| **4U** | Burnout consequences are **Unworkable** (regretted resignations) and **Unavoidable + Urgent** *for the employer* (fixed attrition cost, ESG/duty-of-care obligations). The individual's need is Underserved. The buyer-flip turns three weak U's strong. |
| **BLAC & White** | **Blatant + Critical** for the employer-buyer (vs. Latent + Aspirational for the individual). **White** = async, vernacular, WhatsApp-native, human-in-loop — unoccupied. |
| **3D** | Discontinuous (async micro-care, not video slots) · Disruptive (1 counselor : 100–150) · Defensible (see §5 CORE). |
| **Gain/Pain (>10×)** | ₹499/employee/mo against the **₹15–20L fully-loaded cost of one regretted mid-level resignation** → comfortably >10× for the buyer. |

### Value proposition (sandbox template, filled in)

> *For **HR/People leaders at mid-to-large Indian employers** with a **Blatant + Critical** need to cut burnout-driven attrition that is **unworkable and unavoidable**, who are dissatisfied with **EAPs nobody uses and expensive video-therapy benefits with single-digit utilization**, our product is a **discontinuous, defensible async-vernacular care layer on WhatsApp** that delivers **measurably higher engagement and a private, always-on human-in-the-loop** and overcomes adoption cost with **>10× ROI vs. one avoided resignation**, unlike **legacy EAPs or BetterHelp-style video benefits.***

---

## 3 · Product Workflow Blueprint — Pull · Push · Pivot, re-anchored on retention

> *Cheatsheet §2 (Build Pull, not Push) + Teardown §4 (retention is the headline metric).*

```
[Frictionless Pull] ──> [The Push Insight] ──> [The Retention Loop] ──> [The Pivot]
 (employer onboards;      (AI mirrors +          (gets visibly smarter    (human counselor,
  user texts/voice)        Day-1 "aha")           about YOU over time)      funded by B2B)
```

The original loop is kept — but **a fourth stage is inserted before monetization, because acquisition was never the risk; retention is.**

1. **The Pull (nightly, default 9:00 PM, user-adjustable):** a minimal, non-demanding check-in. Text or raw voice note. *Frictionless by design.*
2. **Real-time structuring:** the LLM scores sentiment (1–5), isolates stressors, flags clinical red flags.
3. **The Push (instant value, <3s):** validation + mirroring the user's own vocabulary so they feel heard.
4. **★ The Retention Loop (new):** the product must visibly *earn day 2, day 7, day 30.* See §4.
5. **Safety Triage (non-negotiable):** any red-flag indicator **breaks the automated loop immediately** → crisis helplines + on-call clinical supervisor alert. This is a **legal and ethical requirement, not a feature** (see §8 DEBT).

---

## 4 · ★ The Retention Loop — engineering the vitamin→painkiller gap

> *Cheatsheet: SLIPPERY-"Proves value quickly" + CORE-"Extended lifecycle value." Teardown §4: the product's own thesis ("when low, executive function → zero") is also its biggest enemy.*

The hardest truth in this business: **the user must engage daily, precisely when they feel worst.** Four mechanisms, each closing a specific gap:

1. **Day-1 "aha" (fix the 7-day value lag):** don't make users wait a week for the first insight. After the *first* entry, reflect one specific, personal observation ("you mentioned your manager twice — want me to watch that pattern?"). Instant *insight*, not just instant *validation*.
2. **Visible personalization (the data flywheel as felt experience):** the bot must *demonstrably* remember and get smarter — "last Tuesday you felt this way too, and a walk helped." This is the moat (§5) made tangible **and** the retention hook.
3. **Variable, low-pressure reward:** vary the check-in (sometimes a prompt, sometimes a tiny reframe, sometimes just "noted, rest well") so it never feels like a chore or a guilt trip.
4. **Gentle accountability, never shame:** a missed night gets a warm low-friction re-open ("no pressure — here whenever you want"), never a streak-breaking guilt mechanic that punishes the exact low-energy state we serve.

**Headline metric:** **D30 retention** of nightly check-ins, per cohort. Everything else (conversion, LTV, B2B renewal) is downstream of it.

---

## 5 · CORE & the moat — what we actually defend

> *Cheatsheet §2 (CORE). Teardown §3: v1 asserted "3D-defensible" and never built it.*

| C.O.R.E. | How Snooze builds it |
|---|---|
| **C — Core differentiation** | The **longitudinal, structured, vernacular emotional dataset per user.** Not the LLM (commodity). This asset (a) makes the product smarter about *you* over time and (b) makes leaving costly — *your whole emotional history lives here.* **Multiply it:** anonymized, aggregated population insight sellable to employers (org-level burnout trends, never individual data). **Lever it:** the same data powers the counselor summary card. |
| **O — Operations** | The **counselor-efficiency engine: 1 : 100–150 via AI triage + auto-summary.** The AI summary card is the lever that makes the human affordable — the multiplier that fixes the Tier-2 margin (§7). |
| **R — Relationships** | Two-sided + distribution: **counselor supply** (junior M.A./M.Sc. psych grads facing a congested job market — flexible remote async work) **+ employer/insurer/university contracts** (co-created, multi-year, hard for competitors to ad-spend around). |
| **E — Extended lifecycle value** | A mental-health journey is *long* → high LCV **if retention holds (§4).** Ladder: AI → async human → priority → couples/family → employer analytics. |

**Four moats, stacked:** (1) accumulated personal data = switching cost · (2) counselor-network liquidity = supply moat · (3) B2B contracts = distribution moat · (4) trust/brand in a stigma category = compounding moat. **Plus compliance (§8) as a barrier to entry.**

---

## 6 · Detailed Chat Script Architecture

> *Mechanics retained from v1 (they were strong); language shifted to Hinglish-first; Day-1 aha added.*

### Phase A — Frictionless acquisition & opt-in
*Employer rolls Snooze out; the employee clicks a link or replies to a pre-filled trigger. No sign-up, no password.*

* **User (pre-filled trigger):** `Start My Journal`
* **Bot:** Welcome to **Snooze**. 🌙 No app, no forms. I'll text you each evening — just reply with a line, a rant, or a voice note about your day. Everything's private and encrypted, and you'll get a weekly read on your stress patterns.
  *On a shared phone? Tap below to set a PIN and turn on disappearing messages.*
  Ready? **How was today, 1 to 5?**
  * `[ 1–2 Rough ]` · `[ 3 Okay ]` · `[ 4–5 Good ]`

### Phase B — The active daily loop (example: the work vent)
* **Bot (9:00 PM):** Time for your evening dump. Text or voice note — kya sabse zyada dimaag mein chal raha hai tonight?
* **User:** *"My manager dumped a 40-page deck on me at 6 PM, due tomorrow morning. I'm so sick of this place, I feel like crying, can't even eat."*
* **Bot (<2s):** That's genuinely overwhelming — getting hit with a heavy load right as the day ends is unfair, and it makes total sense you're too stressed to eat.
  > **Core stressor:** workplace boundary violation
  > **Physical impact:** appetite loss / fight-or-flight
  
  The deck can wait 10 minutes while you eat two bites. Want me to draft a calm boundary-setting reply to your manager?
  * `[ Yes, draft it ]` · `[ No, just log it ]`

### Phase B+ — ★ Day-1 aha (new)
* **Bot (after the first-ever entry):** Noted everything. One thing I'll start watching for you: **work boundaries after 6 PM** seem to be where the pressure spikes. I'll flag if it becomes a pattern — that's how this gets useful for *you* specifically. Rest well. 🌙

### Phase C — Weekly proof of value
* **Bot (Sun 11:00 AM):** Here's your **Weekly Emotional Blueprint**:
```
Mon 🟢4  Tue 🟡3  Wed 🔴1  Thu 🔴2  Fri 🟢4
Insight: 75% of your high-stress triggers fell between 6–8 PM, tied to "work-life boundaries."
Your resilience peaked Friday after a 20-min walk.
```
* **Bot:** You're hitting consistent mid-week burnout. *Your employer's Snooze plan already includes a human counselor* — want a 15-min text/audio check-in with a certified counselor, right here, no video? `[ Book a counselor ]`
  *(In direct-B2C, this same card becomes the ₹499 upgrade.)*

---

## 7 · Business Model & Unit Economics — done honestly

> *Cheatsheet §2 (RSVPD) + §2 (Russian-doll packaging). Teardown §9: v1's "core value" Tier 2 was secretly the thinnest-margin tier.*

### Primary engine — B2B2C (the buyer-flip)
- **Per-seat employer contract: ₹150–400 / employee / month**, billed across the whole covered population (most won't be active in a given month → blended COGS is low).
- The employer's Blatant+Critical ROI: **one avoided regretted resignation (~₹15–20L loaded) pays for thousands of seat-months.** Gain/Pain >10× for the buyer.
- **Why this fixes everything:** it funds CAC, flips the BLAC quadrant, makes human touch a *retention investment* rather than a margin drain, and creates the distribution moat.

### Secondary engine — direct B2C (brand funnel + Russian-doll ladder)
| Tier | Price | What | Margin |
|---|---|---|---|
| **T1 — Automated Mirror** | Free / ₹99 | Daily AI logging, prompts, weekly blueprint | High (token cost ≈ 0) |
| **T2 — Async Human Triage** | ₹599–799 | T1 + 2 human touchpoints/wk | **See margin note** |
| **T3 — Priority Voice** | ₹1,499+ | Async voice, <4h human SLA | Healthy at price |

### ★ The Tier-2 margin note (the honest version)
A counselor at ~₹35k/mo handling 150 patients ≈ **~₹230 / patient / month in labor alone** — so T2 at v1's ₹499 was **structurally thin**. Three fixes, used together:
1. **Re-price** consumer T2 to **₹599–799** (still <½ of one ₹2,000 therapy session).
2. **Raise AI leverage per human-minute** — the summary card means a counselor spends ~2 min, not 20, per touchpoint; push the safe ratio toward 1:150+.
3. **In B2B2C, treat human touch as a renewal-driving retention cost**, funded by the per-seat contract — not a standalone P&L line.

### RSVPD scorecard (target state)
| | Status after v2 |
|---|---|
| **Repeatable** | B2B sales motion + employer rollout playbook |
| **Scalable** | Serverless + 1:150; gated by counselor *quality* scaling (supervised) |
| **Valuable** | Per-seat ARR; **publish LTV:CAC and D30 retention every board cycle** |
| **Predictable & profitable** | Counselor COGS modeled explicitly; T2 margin fixed |
| **Disruptive & defensible** | Disruptive ✅ + four stacked moats (§5) + compliance barrier |

---

## 8 · DEBT — risk register & clinical governance

> *Cheatsheet §1 (DEBT). The original blueprint had no risk section; this is the largest single addition.*

| Risk | Severity | Mitigation (and where it becomes a moat) |
|---|---|---|
| **WhatsApp/Meta dependency** (pricing, template approval, health-policy bans) | 🔴 | Abstract the messaging layer (RCS / SMS / Telegram fallback); multi-model LLM router. Never let Meta own the unit economics. |
| **Regulation** — Telemedicine Guidelines 2020; **DPDP Act 2023** (mental-health data = sensitive personal data); counselor scope-of-practice | 🔴 | Consent-first, data-residency, audit logs, clinical supervision protocol. **Compliance = barrier to entry = moat.** |
| **Shared-phone privacy** (a WhatsApp on a family device is not private) | 🔴 | PIN + disappearing-message mode offered at onboarding; never assume privacy. |
| **Clinical liability / crisis mishandling** — one mishandled suicide = existential | 🔴 | Hard-coded red-flag triage with human-escalation SLA; on-call clinical supervisor; documented protocol; conservative AI scope (mirror, never diagnose/prescribe). |
| **Counselor quality & burnout** at scale | 🟡 | Caseload caps, supervision tier, quality scoring, ongoing training. |

---

## 9 · Technical Architecture

> *Retained from v1 (event-driven serverless was the right call); hardened for the DEBT risks above.*

1. **Ingress:** WhatsApp Cloud API webhook → serverless gateway. *(Messaging layer abstracted behind an interface so RCS/SMS can be swapped in.)*
2. **Compute:** serverless (Supabase Edge / Vercel / Lambda) evaluates the payload in milliseconds.
3. **Routing (`User_Sessions`):** PostgreSQL/Supabase determines state.
   * `user_phone_number` (PK) · `org_id` (employer mapping, **new**) · `assigned_counselor_id` · `routing_state` (`AI` | `HUMAN`) · `weekly_sentiment_log` (JSON) · `privacy_mode` (PIN/ephemeral, **new**) · `consent_ledger` (DPDP audit, **new**)
4. **AI pipeline (state = `AI`):** audio → Groq/Whisper transcription; text → fast LLM (Llama 3 / GPT-4o-mini) with a **bounded context stack** (current msg + last 2 frames + the *personalization memory* that powers §4's "remembers you") — not the full log.
5. **Human router (state = `HUMAN`):** message bypasses the LLM generator, streams over a persistent WebSocket to the assigned counselor's web panel.
6. **Red-flag interceptor (cross-cutting):** runs on *every* inbound message *before* routing; on trigger, overrides state → crisis protocol + supervisor alert.

---

## 10 · The Counselor Omnichannel Dashboard

> *Retained from v1 — the operational lever (CORE-O) that makes the human affordable.*

Counselors never use their phones with clients (privacy + anti-burnout). A unified desktop web client:
- **Client Queue Sidebar:** 100–150 assigned clients, sorted by `[Needs Review]` / `[AI Summary Appended]` / `[Red Flag]`.
- **Cognitive Workspace (split view):** left = chronological chat + playable voice notes; right = **AI-synthesized insight card** (weekly sentiment, stressors, distilled summary) so the counselor never reads text walls — the ~2-min-per-touchpoint lever.
- **Micro-Response Console:** web-audio capture + text, streaming a 2-min response straight to the user's single WhatsApp screen.
- **Supervision layer (new):** red-flag queue + caseload-load monitor for the on-call clinical supervisor.

---

## 11 · Go-To-Market & the pitch

> *Cheatsheet §4 (GTM ≈ 2× the product) + §5 (STORY).*

- **Beachhead:** land 3–5 design-conscious mid-size employers (tech/startup HR who *feel* burnout attrition) → prove **utilization + D30 retention + a renewal**. Utilization is the wedge metric — legacy EAPs die at single-digit utilization; Snooze's WhatsApp-native SLIP design is the differentiator that beats it.
- **Then:** insurers (claims-cost ROI) and universities (student wellbeing mandates).
- **B2C** runs *beneath* as a brand/funnel and a learning lab for the loop — never the primary CAC engine.

**The pitch (STORY):** *Stage* — therapy costs ₹2,000/hr and demands you schedule, travel, and perform "okay." *Tension* — the moment you most need help is the moment you have the least energy to ask, so 90% never start and employers eat the cost. *Opportunity* — meet people inside WhatsApp, async, sub-₹500, AI listening at scale, humans where it counts. *Resolution* — Snooze: a nightly check-in that gets smarter every day, a counselor one message away, sold to the employers already paying for the problem. *Yes!* — a less-burnt-out workforce, flexible work for a counselor corps, and a moat made of accumulated trust.

---

## 12 · Supply-Side Advantage

> *Retained — still true, now framed as CORE-R.*

India's large pool of junior clinical-psych graduates (M.A./M.Sc.) face congested, low-paying entry-level clinic roles. Snooze offers **flexible, remote-first, async** work managing 100–150 patients/week without live-session exhaustion — a supply moat that's hard to assemble and gets stronger with brand.

---

### How v2 maps to the frameworks (start to finish)
**Problem** → 4U (Underserved, but a vitamin) + BLAC (buyer-flip to Blatant+Critical) · **Solution** → 3D with a *built* moat · **Risk** → DEBT register + compliance-as-moat · **Who** → MVS (burnt-out urban knowledge workers, employer-reached) · **Product** → SLIP entry **+ engineered retention** · **Model** → CORE → RSVPD with *honest* unit economics · **GTM** → employer beachhead, utilization metric · **Raise** → FMF: fund moats not ad-CAC, dodge the Money Mirage · **Headline metric** → D30 retention.
