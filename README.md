# 📰 News Research App

A Google-styled news research tool with AI-powered deep search capabilities. Search for news articles from across the web, filter by date range, and export results in multiple formats.

![News Research App](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Anthropic](https://img.shields.io/badge/Anthropic-Claude-orange?style=flat-square)

## ✨ Features

- 🔍 **Deep Research** - AI-powered multi-query search for comprehensive news coverage
- 📰 **Rich Results** - Article title, publisher, date, time, and summary
- 🔗 **Direct Links** - Click to read full articles on original sources
- 📥 **Export Options** - Download as CSV, PDF, or JSON
- 📅 **Date Filtering** - Narrow results to specific date ranges
- 🎨 **Google-Inspired Design** - Clean, modern Material Design interface

## 🚀 Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/news-research-app&env=ANTHROPIC_API_KEY&envDescription=Your%20Anthropic%20API%20key%20for%20Claude&envLink=https://console.anthropic.com/)

### Option 2: Manual Deployment

#### Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push this code to your repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/news-research-app.git
git push -u origin main
```

#### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure Environment Variables:
   - Click **"Environment Variables"**
   - Add: `ANTHROPIC_API_KEY` = `your_api_key_here`
5. Click **"Deploy"**

#### Step 3: Get Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy and paste it into Vercel's environment variables

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Anthropic API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/news-research-app.git
cd news-research-app
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.example .env.local
```

4. Add your Anthropic API key to `.env.local`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
news-research-app/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts    # API endpoint for Anthropic calls
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/
│   └── NewsScraperApp.tsx  # Main app component
├── public/                 # Static assets
├── .env.example           # Environment variables template
├── .gitignore
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes |

### Customization

- **Colors**: Edit the `colors` object in `components/NewsScraperApp.tsx`
- **Search queries**: Modify `searchQueries` array for different search patterns
- **Suggested topics**: Update the topic buttons in the empty state

## 📝 API Usage

The app uses Claude's web search capability through the Anthropic API. Each search performs 3 queries for comprehensive coverage:

1. `{keywords} latest news`
2. `{keywords} breaking news today`
3. `{keywords} news updates {year}`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [Vercel](https://vercel.com) for hosting
- [Lucide](https://lucide.dev) for icons
# newsscrapper
