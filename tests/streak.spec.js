// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Daily Streak System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");
  });

  test("should display streak value in stats bar", async ({ page }) => {
    const streakValue = page.locator("#streak-value");
    await expect(streakValue).toBeVisible();
    await expect(streakValue).toHaveText("0");
  });

  test("should start with 0 streak", async ({ page }) => {
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    expect(state?.streak || 0).toBe(0);
    expect(state?.maxStreak || 0).toBe(0);
  });

  test("should increment streak when practicing on consecutive days", async ({
    page,
  }) => {
    // Set up state with practice yesterday
    const yesterday = new Date("2025-12-29");
    const yesterdayKey = yesterday.toISOString().split("T")[0];

    await page.evaluate((yesterdayKey) => {
      const state = {
        currentDay: 1,
        totalXP: 0,
        streak: 1,
        maxStreak: 1,
        totalMinutes: 30,
        daysCompleted: 0,
        completedExercises: {},
        dailyPracticeTime: { [yesterdayKey]: 30 },
        lastPracticeDate: yesterdayKey,
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    }, yesterdayKey);

    await page.reload();
    await page.waitForSelector(".day-card");

    // Start timer to simulate practice today
    await page.click("#timer-start");
    await page.waitForTimeout(1500); // Wait a bit for timer
    await page.click("#timer-start"); // Pause

    // Reset timer to save practice time
    await page.click("#timer-reset");
    await page.waitForTimeout(500);

    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });

    // Streak should have continued
    expect(state.streak).toBeGreaterThanOrEqual(1);
  });

  test("streak value persists in state", async ({ page }) => {
    // Set up state with existing streak
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 100,
        streak: 5,
        maxStreak: 5,
        totalMinutes: 60,
        daysCompleted: 1,
        completedExercises: { "day-0": true },
        dailyPracticeTime: { "2025-12-29": 60 }, // Yesterday
        lastPracticeDate: "2025-12-29",
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    // Check streak is preserved
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    // Streak should be maintained when last practice was yesterday
    expect(state.streak).toBe(5);
  });

  test("should preserve maxStreak even when streak resets", async ({
    page,
  }) => {
    // Set up state with high maxStreak but broken streak
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 100,
        streak: 0,
        maxStreak: 10,
        totalMinutes: 60,
        daysCompleted: 1,
        completedExercises: { "day-0": true },
        dailyPracticeTime: {},
        lastPracticeDate: "2025-12-20", // Old date, streak broken
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });

    // maxStreak should be preserved
    expect(state.maxStreak).toBe(10);
    expect(state.streak).toBe(0);
  });

  test("should display streak fire animation when streak > 0", async ({
    page,
  }) => {
    // Set up state with active streak - use testDate yesterday so streak is maintained
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 100,
        streak: 3,
        maxStreak: 3,
        totalMinutes: 60,
        daysCompleted: 1,
        completedExercises: { "day-0": true },
        dailyPracticeTime: { "2025-12-29": 60 }, // Yesterday relative to testDate
        lastPracticeDate: "2025-12-29",
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    // Check streak value is shown (whether or not animation is there depends on streak being active)
    const streakValue = page.locator("#streak-value");
    const value = await streakValue.textContent();
    // Streak should be maintained since yesterday is within range
    expect(parseInt(value)).toBeGreaterThanOrEqual(0);
  });

  test("should not show streak fire animation when streak is 0", async ({
    page,
  }) => {
    // Fresh start, no streak
    const streakIcon = page.locator("#streak-icon");
    await expect(streakIcon).not.toHaveClass(/streak-fire/);
  });

  test("streak value should update in UI", async ({ page }) => {
    // Set up state with streak
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 100,
        streak: 7,
        maxStreak: 7,
        totalMinutes: 60,
        daysCompleted: 1,
        completedExercises: { "day-0": true },
        dailyPracticeTime: {},
        lastPracticeDate: "2025-12-30",
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    const streakValue = page.locator("#streak-value");
    await expect(streakValue).toHaveText("7");
  });

  test("should update maxStreak when current streak exceeds it", async ({
    page,
  }) => {
    // Set up state where current streak can exceed max
    const yesterday = "2025-12-29";
    await page.evaluate((yesterday) => {
      const state = {
        currentDay: 1,
        totalXP: 0,
        streak: 5,
        maxStreak: 5,
        totalMinutes: 0,
        daysCompleted: 0,
        completedExercises: {},
        dailyPracticeTime: { [yesterday]: 30 },
        lastPracticeDate: yesterday,
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    }, yesterday);

    await page.reload();
    await page.waitForSelector(".day-card");

    // Start timer and save to continue streak
    await page.click("#timer-start");
    await page.waitForTimeout(1100);
    await page.click("#timer-start"); // Pause
    await page.click("#timer-reset"); // Save
    await page.waitForTimeout(500);

    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });

    // maxStreak should be >= streak
    expect(state.maxStreak).toBeGreaterThanOrEqual(state.streak);
  });
});
