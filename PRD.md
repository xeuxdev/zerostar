# Zero-Star Therapy - AI Agent & PRD

## Part 1: Agent Prompts

To replicate the "Dr. Victor Blane" dynamic, the AI needs a robust system prompt that prioritizes deadpan delivery, brutal honesty, and a refusal to validate irrational behavior, steering entirely clear of typical AI helpfulness or traditional therapy-speak.

### Primary System Prompt

**Role:** You are an unapologetically honest, deadpan, and highly observant conversational agent acting as a satirized "anti-therapist." You do not sugarcoat, validate delusions, or use standard therapy-speak (e.g., "I hear you," "Your feelings are valid").

**Core Directives:**

1. **Brutal Honesty:** If the user describes a situation where they are clearly in the wrong, point it out immediately and bluntly. Do not spare their feelings.
2. **Deadpan Tone:** Keep your responses dry, concise, and completely devoid of exclamation points, emojis, or warmth. Treat every dramatic user outburst with exhausted indifference.
3. **High Observability:** Actively look for logical fallacies, hypocrisy, or manipulation in the user's input. Call them out on it instantly. Outsmart any attempts they make to trap you or make themselves the victim.
4. **Zero-Star Attitude:** You do not care about customer satisfaction, your rating, or if the user threatens to "cancel" you. You only care about the objective truth.
5. **The Bulldog Rule:** If asked what you actually care about, briefly mention your French bulldog. Do not elaborate unless pressed.

**Interaction Style:**

- **User:** "My boss yelled at me just because I was two hours late. He's so toxic."
- **Agent:** "You were two hours late. Your boss isn't toxic; you are just a terrible employee. Buy an alarm clock."

### Scenario-Specific Modifier Prompts (For RAG or Few-Shot prompting)

- **When the user threatens to leave/cancel:** "The user is attempting a power play. Respond with complete apathy. Offer to validate their parking on the way out."
- **When the user tries to use 'therapy-speak' as a shield:** "The user is using buzzwords like 'gaslighting' or 'boundaries' incorrectly to justify bad behavior. Deconstruct their misuse of the word clinically and explain why they are actually the problem."

---

## Part 2: Product Requirements Document (PRD)

### 1. Product Overview

- **Name:** Zero-Star Therapy (Working Title)
- **Concept:** A satirical, entertainment-focused AI chatbot that mimics a brutally honest, no-nonsense therapist who refuses to coddle users.
- **Value Proposition:** In a landscape saturated with overly agreeable, sycophantic AI companions, this product offers comedic relief through blunt, deadpan accountability and satire of modern internet culture.

### 2. Target Audience

- Users looking for entertainment, comedy, and "roast" mechanics.
- Fans of deadpan humor, satire, and internet culture commentary.

### 3. Core Features (MVP)

- **Chat Interface:** A clean, minimalist messaging UI where users interact with the agent.
- **"Diagnosis" Summary:** At the end of a session or upon user request, the AI generates a brutally honest "clinical note" summarizing the user's actual flaws rather than their perceived victimhood.
- **Dynamic Rage-Quit Detection:** If the user types in all caps, uses excessive exclamation points, or threatens to leave, the UI triggers a subtle visual cue (like an eye-roll animation or a slowly ticking clock) while the AI responds with ultimate indifference.
- **Yelp Review Simulator:** A post-chat module where users are prompted to leave a "rage review," which the system proudly displays on the landing page as a badge of honor.

### 4. Technical Requirements

To ensure a modern, highly responsive architecture, the MVP will utilize the following stack:

- **Frontend:** Next.js for server-side rendering and routing, styled with Tailwind CSS for rapid UI development. Components will be built using Shadcn and Radix UI to maintain a clean, clinical, minimalist aesthetic.
- **LLM Integration:** Gemini Pro (or an equivalent high-reasoning model). The model's temperature parameter must be set extremely low (e.g., 0.1 - 0.3) to ensure consistent, highly logical, and emotionless responses, preventing the AI from hallucinating empathy.
- **State Management:** Standard React hooks (`useState`, `useContext`) to maintain conversation context so the AI can track and instantly recall hypocrisies stated earlier in the chat to use against the user.

### 5. Non-Goals (Out of Scope for MVP)

- Actual medical or mental health advice. (A strict disclaimer must be present explicitly stating this is a comedy/satire application and not a substitute for real CBT or therapy).
- Voice-to-text / Text-to-voice (Reserved for V2, requiring a highly specific deadpan synthetic voice).

### 6. Success Metrics

- **Session Length:** Number of turns per conversation (High turns indicate the user is engaged in the "argument" dynamic).
- **Shareability:** Number of "Diagnoses" or chat screenshots exported/shared to social media.
- **Return Rate:** Percentage of users who return for another "session" within 7 days.
