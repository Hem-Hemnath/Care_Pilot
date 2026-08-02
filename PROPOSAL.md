# The Avengers

**Tech for Good 2026** · GDG Coimbatore · Build weekend Aug 8–9, GRD College

**Track:** AI for Good Health & Well-being
**Team code:** TEAM-102

## Problem

Mrs. Lakshmi, a 48-year-old homemaker from Coimbatore, is the primary caregiver for her 74-year-old mother, who takes medicines for diabetes, hypertension, and thyroid disease. She manages multiple medicine strips every day, but after medicines are removed from their original boxes, the strips often get mixed together. When she encounters an unfamiliar tablet or medicine strip, she is unsure of its name or purpose.

Her current options are to search the medicine name online, call another family member, or visit a nearby pharmacy. This process takes time and creates unnecessary stress, especially when medicine names are long, difficult to pronounce, or printed in very small text.

Our goal is to help caregivers like Lakshmi quickly identify an unfamiliar medicine from a photo and understand its basic purpose in simple Tamil or English within 30 seconds, making medicine management safer and easier.

## Who it helps

Our primary user is Lakshmi (48), a family caregiver who manages multiple prescription medicines for her elderly mother.

Like many caregivers across India, she is not a healthcare professional but is responsible for ensuring the correct medicine is given at the right time. She needs a fast and reliable way to identify unfamiliar medicines without depending on internet searches or pharmacy visits.

The solution also benefits:

Elderly patients who struggle to read small medicine labels.
Family members caring for parents or grandparents with chronic illnesses.
Individuals who prefer medicine information in their regional language.

## Solution

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

## Architecture

                                                      MedLens AI Architecture
     
                                            Caregiver Opens Web Application
                                                                     │
                                                                    ▼
                                                    Capture / Upload Medicine Photo
                                                                    │
                                                                   ▼
                                                 React.js Frontend Interface
                                                                    │
                                                                   ▼
                                                   FastAPI Backend Service
                                                                  │
                   ┌─────────────────┴─────────────────┐
                   ▼                                                                                         ▼
        Gemini Vision API                                                   Image Preprocessing 
        (Medicine Identification)                                       (OCR & Text Extraction)
                     │
                    ▼
    Medicine Verification Layer
 (Trusted Medicine Database)
                │
               ▼
 Gemini Language Model
 (Simplifies Medical Information
  + Tamil / English Translation)
                │
                ▼
      User Receives

 • Medicine Name
 • Purpose
 • Active Ingredient
 • Safety Information
 • Easy-to-understand Explanation

## Tech stack

React.js, HTML, CSS, JavaScript, Python/FastAPI, REST API, Google Gemini Vision API, OCR, Firebase Firestore, Google Cloud Run

## Getting started

1. Accept your collaborator invite (check your email / GitHub notifications).
2. Clone this repo and start building.
3. Commit early and often — this repo is what you present on the day.

---

_Created automatically when your proposal was validated._