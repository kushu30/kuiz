<div align="center">
  <img width="200" height="200" alt="logo" src="[https://github.com/user-attachments/assets/169f5ff2-05cb-4269-8390-042b425e174e](https://private-user-images.githubusercontent.com/178865275/497066012-8337dc04-05c3-4044-8788-ba2b2f85f108.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NTk0ODQ4NDMsIm5iZiI6MTc1OTQ4NDU0MywicGF0aCI6Ii8xNzg4NjUyNzUvNDk3MDY2MDEyLTgzMzdkYzA0LTA1YzMtNDA0NC04Nzg4LWJhMmIyZjg1ZjEwOC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMDAzJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTAwM1QwOTQyMjNaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00NzlkNmEzYjUxMmNhZDQwZWZhNGNiNzQ1NWM2Njk5M2RlOTA0NjhmZDY5MWE2YjEyODQ4NzRlMzE3ZDNkNzVjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.XPpRBHZmbBtigV_TXivPOglIRgKl5IqrxKI0O31-jX0)" />

  
  # Kuiz
  
  **Modern Web-Based Quiz Platform**
  
  Built with React, Vite, TailwindCSS, Supabase, and Netlify
  
[![Click to open deployment](https://img.shields.io/badge/Live%20Demo-Click%20Here-brightgreen?style=for-the-badge)](https://kuiz.kushu30.dev/)
  
</div>

---

## Overview

**Kuiz** is a comprehensive quiz platform that enables administrators to create, manage, and share quizzes while participants can seamlessly join via code or link, attempt quizzes, and view results in real-time.

## Key Features

### **For Administrators**
- **Quiz Creation** - Create MCQs or text-based questions with image support
- **AI Integration** - Auto-generate questions using Gemini Flash 2.5
- **Quiz Management** - Add, edit, reorder, or delete questions
- **Share Options** - Distribute via link, QR code, or WhatsApp
- **Result Analytics** - View per-user results with detailed responses

### **For Participants**  
- **Easy Access** - Join with 6-character code or shareable link
- **Guided Experience** - Configurable guidelines and timer controls
- **Instant Results** - Immediate scoring or delayed email delivery

### **Core Functionality**
- **Secure Authentication** - Google sign-in via Supabase Auth
- **Real-time Participation** - Live quiz sessions with timer management
- **Flexible Results** - Instant display or scheduled email delivery

## Tech Stack

```
Frontend     React + Vite + TypeScript
UI/UX        TailwindCSS + Framer Motion  
Backend      Supabase (Auth & Database)
Deployment   Netlify (Serverless Functions)
AI           Gemini Flash 2.5
```

## Quick Start

### Prerequisites
- Node.js (>= 18)
- Supabase project credentials
- Netlify account

### Installation

```bash
git clone https://github.com/your-username/kuiz.git
cd kuiz
npm install
```

### Environment Setup

Create `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role
GEMINI_API_KEY=your_gemini_api_key
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```
