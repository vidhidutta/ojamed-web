# OjaMed Web (Frontend)

Static React app that uploads a slide deck to the OjaMed API and downloads `ojamed_deck.zip`.

## Setup
```bash
cp .env.example .env.local
# edit VITE_API_URL to your Render API base (no trailing slash)
npm install
npm run dev

Open http://localhost:5173
Build
npm run build
npm run preview

Deploy to Cloudflare Pages
Connect this repo in Workers & Pages → Create Project


Build command: npm run build


Output directory: dist


After deploy, if CORS errors occur:


Add the Pages URL to ALLOWED_ORIGINS on your API and redeploy.
