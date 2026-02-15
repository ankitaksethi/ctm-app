Clinical Trial Search App
LLM generated clinical filters based on the conditions tag for each clinical trial provided by clinical trials . gov API and a Gemini Assistant for verifying eligibility based on the official eligibility (inclusion and exclusion) criteria

<<<<<<< HEAD
Clinical Trial Matcher
Overview
An intelligent clinical trial discovery platform that leverages AI to help patients find relevant clinical trials based on their medical conditions, age, and specific health profile. The system streamlines the traditionally complex process of clinical trial matching by automating data retrieval, intelligent categorization, and personalized filtering.
Key Features
🔍 Smart Trial Discovery

Real-time data integration with ClinicalTrials.gov API
Automatic fetching of recruiting trials based on primary diagnosis
Support for multiple trial statuses and filtering criteria

🤖 AI-Powered Taxonomy

Uses Google Gemini AI to automatically categorize medical conditions into structured taxonomies
Organizes conditions into three main categories:

Genetic Conditions: Chromosomal anomalies, hereditary syndromes, gene mutations
Recent Medical Events: Acute symptoms, surgical interventions, recent diagnoses
Other Major Diagnoses: Chronic diseases, primary malignancies, systemic conditions


Intelligent mapping from raw condition strings to standardized medical terms

🎯 Personalized Filtering

Age-based filtering: Automatically filters trials based on patient age eligibility
Condition-based matching: Multi-select checkboxes allow patients to specify their exact health conditions
Dynamic results: Real-time trial list updates based on selected criteria

📋 Comprehensive Trial Information
Each trial card displays:

Trial NCT ID and official title
Recruitment status (color-coded badges)
Associated medical conditions
Study summary and detailed description
Eligibility criteria with age ranges
Start dates and timeline information
AI-generated taxonomy tags for quick condition identification

📞 Contact & Location Details
Expandable trial cards reveal:

Central study contacts with phone and email
Multiple study locations with facility names and addresses
Direct links to full protocol on ClinicalTrials.gov
Easy-to-access communication channels for enrollment inquiries

💬 Eligibility Verification

Interactive chat interface for eligibility verification
AI-powered assistant to help assess trial suitability
Conversational approach to complex medical criteria

Technical Architecture
Backend (Python)

Data Fetching: REST API integration with ClinicalTrials.gov v2 API
Data Processing: Pandas-based data flattening and restructuring
AI Integration: Google Gemini API for intelligent medical taxonomy
Filtering Logic: Multi-criteria filtering engine with age and condition matching

Frontend (React + TypeScript)

Modern UI: Clean, accessible interface with Tailwind CSS
Component Architecture: Modular trial cards with expandable details
Icons: Lucide React for consistent, professional iconography
Responsive Design: Mobile-friendly layouts with grid-based information display
Interactive Elements: Smooth animations and transitions for enhanced UX

--

To deploy, update project ID and use the deploy script 
=======
Deployed on google cloud run https://trial-map-59509387646.us-central1.run.app

To deploy it in your GCP Project,  run ./deploy.sh and replace with your Project ID and input your Gemini Key to save as a secret in GCP 


Front end Designed with Google Studio
>>>>>>> b6b9514543b2ef638ef750d66aa3c8771ebea55a
