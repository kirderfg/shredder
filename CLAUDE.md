# SHREDDER - 30 Day Guitar Training App

## Overview

SHREDDER is a single-page web application for iPhone that gamifies a 30-day guitar training program. The course content is based on a Swedish guitar training PDF featuring 6 legendary guitarists (Dave Mustaine, Marty Friedman, Adrian Smith, Dave Murray, Yngwie Malmsteen, Zakk Wylde, and Tommy Johansson).

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (single-page app)
- **Graphics**: PixiJS for animated fire particles and pixelated skulls background
- **Storage**: Browser localStorage for progress persistence
- **Data**: Course content loaded from separate JSON file

## File Structure

```
shredder/
├── index.html         # Main application (HTML + CSS + JS)
├── course-data.json   # Course content (guitarists, days, exercises, quotes)
├── CLAUDE.md          # This file
└── .nojekyll          # Required for GitHub Pages (prevents Jekyll processing)
```

## Features

- **Gamification**: XP system, 9 levels (Nybörjare → Gitarrgud), 15 achievements, daily streaks
- **Practice Timer**: Track daily practice time with start/pause/reset
- **Day Navigation**: View any day's exercises, navigate between days
- **Progress Tracking**: Checkboxes for exercises, completion status per day
- **Heavy Metal Theme**: Fire particles, pixelated skulls, dark red/orange color scheme
- **iPhone Optimized**: Safe area insets, PWA meta tags, touch-friendly UI

## Course Data

The `course-data.json` file contains:
- **guitarists**: Info about each instructor (name, band, emoji, color)
- **levels**: XP thresholds and rank names for the 9 levels
- **achievements**: 15 unlockable achievements with conditions
- **days**: All 30 days of training content (exercises, quotes, XP values)

The app loads this JSON file on startup via `fetch('course-data.json')`.

## Important Dates

- **Start Date**: December 29, 2025 (hardcoded in index.html)
- Each day unlocks based on real calendar date

## Deployment to GitHub Pages

This is a public repository. To deploy to GitHub Pages:

1. **Create `.nojekyll` file** (prevents Jekyll from ignoring files starting with underscore):
   ```bash
   touch .nojekyll
   ```

2. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: / (root)
   - Save

4. **Access the app**:
   ```
   https://kirderfg.github.io/shredder/
   ```

## URL References

All asset references in the app use **relative paths**:
- `course-data.json` is loaded via `fetch('course-data.json')` (relative)
- PixiJS is loaded from CDN: `https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.js`

This ensures the app works correctly when served from:
- Local file system (via HTTP server)
- GitHub Pages subdirectory (`/shredder/`)
- Any other hosting environment

## Local Development

To test locally, serve via HTTP (required for fetch to work):

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx serve .

# Then open http://localhost:8080
```

## localStorage Schema

Progress is stored under key `shredder_progress`:

```javascript
{
  currentDay: 1,           // Current viewed day
  totalXP: 0,              // Accumulated XP
  streak: 0,               // Current daily streak
  maxStreak: 0,            // Best streak achieved
  totalMinutes: 0,         // Total practice time
  daysCompleted: 0,        // Days with all exercises done
  completedExercises: {},  // { "dayIndex-exerciseIndex": true }
  dailyPracticeTime: {},   // { "YYYY-MM-DD": minutes }
  lastPracticeDate: null,  // Last practice date string
  achievements: []         // Array of unlocked achievement IDs
}
```

## Modifying Course Content

To update exercises, quotes, or add days:
1. Edit `course-data.json`
2. Follow the existing structure
3. No code changes needed in `index.html`

Achievement conditions are mapped dynamically from JSON:
- `type`: The state property to check (`daysCompleted`, `maxStreak`, `totalXP`, `totalMinutes`)
- `value`: The threshold value to unlock
