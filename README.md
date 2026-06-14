# YDS Chat

A ChatGPT-style AI chat web app with Firebase Google Sign-In and Realtime Database chat persistence.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Firebase setup (required before deploy)

1. **Enable Google Sign-In**
   - Firebase Console → Authentication → Sign-in method → Google → Enable

2. **Add authorized domains** (after you get your deploy URL)
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add your Netlify/Render domain (e.g. `your-app.netlify.app`)

3. **Realtime Database rules** (Firebase Console → Realtime Database → Rules):

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## Deploy to Netlify

### Checklist

- [ ] Push code to GitHub/GitLab/Bitbucket
- [ ] Create a Netlify account at [netlify.com](https://netlify.com)
- [ ] **Add new site** → Import from Git → select your repo
- [ ] Build settings (auto-detected from `netlify.toml`):
  - Build command: `npm run build`
  - Publish directory: `dist`
- [ ] Click **Deploy site**
- [ ] Copy your Netlify URL (e.g. `https://random-name.netlify.app`)
- [ ] Add that domain to Firebase **Authorized domains**
- [ ] Test: open site → Sign in with Google → send a message → refresh → chat should persist in sidebar

### Optional: custom domain

- [ ] Netlify → Domain settings → Add custom domain
- [ ] Add custom domain to Firebase Authorized domains too

---

## Deploy to Render

### Checklist

- [ ] Push code to GitHub/GitLab
- [ ] Create a Render account at [render.com](https://render.com)
- [ ] **New** → **Static Site** → Connect your repo
- [ ] Settings:
  - Name: `ydschat`
  - Branch: `main`
  - Build command: `npm install && npm run build`
  - Publish directory: `dist`
- [ ] Click **Create Static Site**
- [ ] Wait for deploy to finish; copy your Render URL (e.g. `https://ydschat.onrender.com`)
- [ ] Add that domain to Firebase **Authorized domains**
- [ ] Test: sign in, chat, refresh, verify saved chats in sidebar

> Alternatively, use the included `render.yaml` blueprint: **New** → **Blueprint** → connect repo.

---

## Features

- ChatGPT-like dark UI, responsive on mobile, tablet, and desktop
- Hamburger menu toggles sidebar with saved chats (when signed in)
- Google Sign-In (top right)
- Chats saved to Firebase Realtime Database per user
- AI currently responds with **hello** to any message

## Project structure

```
src/
  components/   # UI components
  hooks/        # useAuth, useChats
  lib/          # Firebase config
  types/        # TypeScript types
```
