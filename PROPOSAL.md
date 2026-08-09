# Architecture Proposal

> Fill this out and commit it by **Friday, July 24 · 11:59 PM IST**. This file *is*
> your Ideation-Phase submission — no separate form. Keep it living; update it as
> your design evolves.

- **Team name:** _ The Avengers
- **Team code:** _ TEAM-102
- **Track:**  AI for Good Health & Well-being 
- **Members:** _SRINATH (GitHub - Srinathsenthilkumar), SARUGESHWARAN (GitHub - sarugeshwaran),MYVILIKANNAN ( GitHub - myvilikannan-007), HEMNATH ( Github - Hem-hemnath)

## 1. Problem
Mrs. Lakshmi, a 48-year-old homemaker from Coimbatore, is the primary caregiver for her 74-year-old mother, who takes medicines for diabetes, hypertension, and thyroid disease. She manages multiple medicine strips every day, but after medicines are removed from their original boxes, the strips often get mixed together. When she encounters an unfamiliar tablet or medicine strip, she is unsure of its name or purpose.

Her current options are to search the medicine name online, call another family member, or visit a nearby pharmacy. This process takes time and creates unnecessary stress, especially when medicine names are long, difficult to pronounce, or printed in very small text.

Our goal is to help caregivers like Lakshmi quickly identify an unfamiliar medicine from a photo and understand its basic purpose in simple Tamil or English within 30 seconds, making medicine management safer and easier.

## 2. Who it helps
Our primary user is Lakshmi (48), a family caregiver who manages multiple prescription medicines for her elderly mother.

Like many caregivers across India, she is not a healthcare professional but is responsible for ensuring the correct medicine is given at the right time. She needs a fast and reliable way to identify unfamiliar medicines without depending on internet searches or pharmacy visits.

The solution also benefits:

Elderly patients who struggle to read small medicine labels.
Family members caring for parents or grandparents with chronic illnesses.
Individuals who prefer medicine information in their regional language.
## 3. Proposed solution
We propose MedLens AI, an AI-powered web application that enables caregivers to identify unfamiliar medicines using only a photograph.

The caregiver simply captures or uploads an image of a medicine strip, blister pack, or tablet. The application uses Gemini Vision to extract visible text, medicine names, tablet markings, and packaging details. The identified medicine is then verified against trusted medicine information sources before generating an easy-to-understand explanation.

Instead of presenting complex pharmaceutical terminology, MedLens AI provides:

Medicine name
Active ingredient
Strength
Common medical purpose
Important precautions
Basic usage guidance
Simple explanations in Tamil or English

Our 24-hour MVP focuses on one measurable outcome:

Helping a caregiver identify an unfamiliar medicine and understand its purpose in under 30 seconds.

The application does not diagnose diseases, prescribe medicines, recommend dosage changes, or replace professional medical advice. It is designed only to improve medicine identification and understanding.

After the hackathon, the application will be deployed as a publicly accessible web application that caregivers can open from any smartphone browser without installing additional software.
## 4. High-level architecture
_Key components and how data flows. 
```
React PWA → FastAPI REST API → Gemini Vision API (Medicine Identification + OCR) → Medicine Verification Layer → Gemini API (Simple Explanation & Translation) → Firebase Firestore  
```

## 5. Tech stack
_Languages, frameworks, and the Google/AI tools you plan to use (Gemini API, Cloud Run, Firebase, etc.)._

## 6. Milestones to hackathon day
_A rough plan from now to Aug 8–9._

- [ ] …
- [ ] …

## 7. Open questions / help needed
_Anything you're unsure about or want mentor input on._
