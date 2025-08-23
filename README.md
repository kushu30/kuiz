<div align="center">
  <img width="200" height="200" alt="logo" src="https://github.com/user-attachments/assets/169f5ff2-05cb-4269-8390-042b425e174e" />

  
  # Kuiz
  
  **Modern Web-Based Quiz Platform**
  
  Built with React, Vite, TailwindCSS, Supabase, and Netlify
  
[![Click to open deployment](https://img.shields.io/badge/Live%20Demo-Click%20Here-brightgreen?style=for-the-badge)](https://kuizit.netlify.app)
  
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

## Deployment

1. **Connect to Netlify** - Link your GitHub repository
2. **Build Settings** - Set build command: `npm run build` | Publish directory: `dist`
3. **Environment Variables** - Add all required variables in Netlify settings
4. **Deploy** - Automatic deployment on push

## License

MIT License - feel free to use this project for your own purposes.

---

<div align="center">
  
**Built with ❤️ for seamless quiz experiences**

</div>
