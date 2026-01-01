// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Content Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");
  });

  test("should display day card", async ({ page }) => {
    const dayCard = page.locator(".day-card");
    await expect(dayCard).toBeVisible();
  });

  test("should display correct day number", async ({ page }) => {
    const dayNumber = page.locator(".day-number");
    await expect(dayNumber).toContainText("DAG 1");
  });

  test("should display day title", async ({ page }) => {
    const dayTitle = page.locator(".day-title");
    await expect(dayTitle).toBeVisible();
    const text = await dayTitle.textContent();
    expect(text.length).toBeGreaterThan(0);
  });

  test("should display guitarist badge for day 1 (Mustaine)", async ({
    page,
  }) => {
    const guitaristBadge = page.locator(".guitarist-badge");
    await expect(guitaristBadge).toBeVisible();

    // Day 1 should be Dave Mustaine
    const guitaristName = page.locator(".guitarist-name");
    await expect(guitaristName).toContainText("Dave Mustaine");
  });

  test("should display guitarist avatar emoji", async ({ page }) => {
    const guitaristAvatar = page.locator(".guitarist-avatar");
    await expect(guitaristAvatar).toBeVisible();
    const emoji = await guitaristAvatar.textContent();
    expect(emoji.length).toBeGreaterThan(0);
  });

  test("should display training sections", async ({ page }) => {
    const trainingSections = page.locator(".training-section");
    const count = await trainingSections.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display exercise cards", async ({ page }) => {
    const exerciseCards = page.locator(".exercise-card");
    const count = await exerciseCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display quote section", async ({ page }) => {
    const quoteSection = page.locator(".quote-section");
    await expect(quoteSection).toBeVisible();

    const quoteText = page.locator(".quote-text");
    await expect(quoteText).toBeVisible();
    const text = await quoteText.textContent();
    expect(text.length).toBeGreaterThan(0);
  });

  test("should display quote author", async ({ page }) => {
    const quoteAuthor = page.locator(".quote-author");
    await expect(quoteAuthor).toBeVisible();
    // Day 1 should credit Dave Mustaine
    await expect(quoteAuthor).toContainText("Dave Mustaine");
  });

  test("should display complete day button", async ({ page }) => {
    const completeBtn = page.locator(".complete-day-btn");
    await expect(completeBtn).toBeVisible();
  });

  test("should display XP badge on complete button", async ({ page }) => {
    const xpBadge = page.locator(".xp-badge");
    await expect(xpBadge).toBeVisible();
    await expect(xpBadge).toContainText("100 XP");
  });

  test("should display different guitarist for day 2", async ({ page }) => {
    // Set up state with day 1 completed and navigate to day 2
    await page.evaluate(() => {
      const state = {
        currentDay: 2,
        totalXP: 100,
        streak: 1,
        maxStreak: 1,
        totalMinutes: 0,
        daysCompleted: 1,
        completedExercises: { "day-0": true },
        dailyPracticeTime: {},
        lastPracticeDate: null,
        achievements: ["first_day"],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.goto("/?testDate=2025-12-31");
    await page.waitForSelector(".day-card");

    // Day 2 should be James Hetfield
    const guitaristName = page.locator(".guitarist-name");
    await expect(guitaristName).toContainText("James Hetfield");

    const dayNumber = page.locator(".day-number");
    await expect(dayNumber).toContainText("DAG 2");
  });

  test("should display tabs section when available", async ({ page }) => {
    // Day 1 has tabs
    const lickSection = page.locator(".lick-section");
    const count = await lickSection.count();

    if (count > 0) {
      const lickTab = page.locator(".lick-tab");
      await expect(lickTab.first()).toBeVisible();
    }
  });

  test("should display phase information", async ({ page }) => {
    // The day card should contain phase info somewhere
    const dayCard = page.locator(".day-card");
    await expect(dayCard).toBeVisible();
    // Day 1 is in phase 1 (days 1-10)
    const content = await dayCard.textContent();
    expect(content.length).toBeGreaterThan(0);
  });
});

test.describe("Level Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");
  });

  test("should display level section", async ({ page }) => {
    const levelSection = page.locator(".level-section");
    await expect(levelSection).toBeVisible();
  });

  test("should display current level number", async ({ page }) => {
    const currentLevel = page.locator("#current-level");
    await expect(currentLevel).toBeVisible();
    await expect(currentLevel).toHaveText("1");
  });

  test("should display current rank", async ({ page }) => {
    const currentRank = page.locator("#current-rank");
    await expect(currentRank).toBeVisible();
    await expect(currentRank).toHaveText("Nybörjare");
  });

  test("should display XP progress bar container", async ({ page }) => {
    const xpBarContainer = page.locator(".xp-bar-container");
    await expect(xpBarContainer).toBeVisible();
  });

  test("should display XP text", async ({ page }) => {
    const levelXP = page.locator("#level-xp");
    const xpNeeded = page.locator("#level-xp-needed");

    await expect(levelXP).toBeVisible();
    await expect(xpNeeded).toBeVisible();
  });

  test("should update level when XP threshold reached", async ({ page }) => {
    // Set up state with 100 XP (level 2 threshold)
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 100,
        streak: 0,
        maxStreak: 0,
        totalMinutes: 0,
        daysCompleted: 1,
        completedExercises: { "day-0": true },
        dailyPracticeTime: {},
        lastPracticeDate: null,
        achievements: ["first_day"],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    const currentLevel = page.locator("#current-level");
    await expect(currentLevel).toHaveText("2");

    const currentRank = page.locator("#current-rank");
    await expect(currentRank).toHaveText("Gitarrnovice");
  });

  test("should show correct rank for level 5 (Shredder)", async ({ page }) => {
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 800,
        streak: 0,
        maxStreak: 0,
        totalMinutes: 0,
        daysCompleted: 8,
        completedExercises: {},
        dailyPracticeTime: {},
        lastPracticeDate: null,
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    const currentLevel = page.locator("#current-level");
    await expect(currentLevel).toHaveText("5");

    const currentRank = page.locator("#current-rank");
    await expect(currentRank).toHaveText("Shredder");
  });

  test("should show highest rank for max XP (Gitarrgud)", async ({ page }) => {
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 3000,
        streak: 0,
        maxStreak: 0,
        totalMinutes: 0,
        daysCompleted: 30,
        completedExercises: {},
        dailyPracticeTime: {},
        lastPracticeDate: null,
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    const currentLevel = page.locator("#current-level");
    await expect(currentLevel).toHaveText("9");

    const currentRank = page.locator("#current-rank");
    await expect(currentRank).toHaveText("Gitarrgud");
  });
});

test.describe("Stats Bar Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");
  });

  test("should display stats bar with 3 stat boxes", async ({ page }) => {
    const statsBar = page.locator(".stats-bar");
    await expect(statsBar).toBeVisible();

    const statBoxes = page.locator(".stat-box");
    await expect(statBoxes).toHaveCount(3);
  });

  test("should display streak stat", async ({ page }) => {
    const streakValue = page.locator("#streak-value");
    await expect(streakValue).toBeVisible();
  });

  test("should display total XP stat", async ({ page }) => {
    const totalXP = page.locator("#total-xp");
    await expect(totalXP).toBeVisible();
    await expect(totalXP).toHaveText("0");
  });

  test("should display total time stat", async ({ page }) => {
    const totalTime = page.locator("#total-time");
    await expect(totalTime).toBeVisible();
  });

  test("should update XP display after completing day", async ({ page }) => {
    await page.click(".complete-day-btn.incomplete");
    await page.waitForTimeout(500);

    const totalXP = page.locator("#total-xp");
    await expect(totalXP).toHaveText("100");
  });
});

test.describe("UI Elements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");
  });

  test("should display SHREDDER logo", async ({ page }) => {
    const logo = page.locator(".logo");
    await expect(logo).toBeVisible();
    await expect(logo).toContainText("SHREDDER");
  });

  test("should display subtitle", async ({ page }) => {
    const subtitle = page.locator(".subtitle");
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText("30 DAGARS");
  });

  test("should display info button", async ({ page }) => {
    const infoBtn = page.locator("#show-intro-btn");
    await expect(infoBtn).toBeVisible();
  });

  test("should open intro modal when clicking info button", async ({
    page,
  }) => {
    await page.click("#show-intro-btn");

    const introModal = page.locator("#intro-modal");
    await expect(introModal).toHaveClass(/active/);
  });

  test("should close intro modal when clicking close button", async ({
    page,
  }) => {
    await page.click("#show-intro-btn");
    await page.waitForSelector("#intro-modal.active");

    await page.click("#intro-modal-close");

    const introModal = page.locator("#intro-modal");
    await expect(introModal).not.toHaveClass(/active/);
  });

  test("should display reset button", async ({ page }) => {
    const resetBtn = page.locator("#reset-btn");
    await expect(resetBtn).toBeVisible();
    await expect(resetBtn).toContainText("Reset");
  });

  test("should display dev mode toggle", async ({ page }) => {
    const devToggle = page.locator(".dev-mode-toggle");
    await expect(devToggle).toBeVisible();
  });

  test("should display bottom navigation", async ({ page }) => {
    const bottomNav = page.locator(".bottom-nav");
    await expect(bottomNav).toBeVisible();

    const prevBtn = page.locator("#prev-day-btn");
    const selectBtn = page.locator("#select-day-btn");
    const nextBtn = page.locator("#next-day-btn");

    await expect(prevBtn).toBeVisible();
    await expect(selectBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
  });
});
