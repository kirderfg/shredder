// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Achievements System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");
  });

  test("should display achievements grid", async ({ page }) => {
    const grid = page.locator("#achievements-grid");
    await expect(grid).toBeVisible();

    // Should have 15 achievements
    const achievements = page.locator(".achievement");
    await expect(achievements).toHaveCount(15);
  });

  test("should start with no achievements unlocked", async ({ page }) => {
    const unlockedAchievements = page.locator(".achievement.unlocked");
    await expect(unlockedAchievements).toHaveCount(0);
  });

  test("should unlock 'First Day' achievement after completing day 1", async ({
    page,
  }) => {
    // Complete day 1
    await page.click(".complete-day-btn.incomplete");

    // Wait for state update
    await page.waitForTimeout(500);

    // Check achievement unlocked
    const unlockedAchievements = page.locator(".achievement.unlocked");
    await expect(unlockedAchievements).toHaveCount(1);

    // Verify state
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    expect(state.achievements).toContain("first_day");
  });

  test("should unlock XP-based achievement (500 XP)", async ({ page }) => {
    // Set up state with 400 XP (close to 500)
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 400,
        streak: 0,
        maxStreak: 0,
        totalMinutes: 0,
        daysCompleted: 4,
        completedExercises: {
          "day-0": true,
          "day-1": true,
          "day-2": true,
          "day-3": true,
        },
        dailyPracticeTime: {},
        lastPracticeDate: null,
        achievements: ["first_day"],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    // Use testDate that allows day 5 to be accessed
    await page.goto("/?testDate=2026-01-03");
    await page.waitForSelector(".day-card");

    // Complete another day to reach 500 XP
    await page.click(".complete-day-btn.incomplete");
    await page.waitForTimeout(500);

    // Verify 500 XP achievement unlocked
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    expect(state.achievements).toContain("xp_500");
    expect(state.totalXP).toBe(500);
  });

  test("should unlock streak achievement (3 days) when maxStreak reaches 3", async ({
    page,
  }) => {
    // Set up state with maxStreak already at 3 to trigger achievement
    await page.evaluate(() => {
      const state = {
        currentDay: 3,
        totalXP: 200,
        streak: 3,
        maxStreak: 3,
        totalMinutes: 0,
        daysCompleted: 2,
        completedExercises: { "day-0": true, "day-1": true },
        dailyPracticeTime: {},
        lastPracticeDate: "2026-01-01",
        achievements: ["first_day"],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.goto("/?testDate=2026-01-02");
    await page.waitForSelector(".day-card");

    // Complete day 3 to trigger achievement check
    await page.click(".complete-day-btn.incomplete");
    await page.waitForTimeout(500);

    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    expect(state.achievements).toContain("streak_3");
    expect(state.maxStreak).toBeGreaterThanOrEqual(3);
  });

  test("should unlock time-based achievement (1 hour)", async ({ page }) => {
    // Set up state with 55 minutes already
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 0,
        streak: 0,
        maxStreak: 0,
        totalMinutes: 55,
        daysCompleted: 0,
        completedExercises: {},
        dailyPracticeTime: {},
        lastPracticeDate: null,
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    // Start timer and simulate 5+ minutes to reach 60
    // For testing, we'll directly manipulate the state
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("shredder_progress"));
      state.totalMinutes = 60;
      // Trigger achievement check by completing a day
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    // Complete day to trigger achievement check
    await page.click(".complete-day-btn.incomplete");
    await page.waitForTimeout(500);

    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    expect(state.achievements).toContain("time_1h");
  });

  test("should unlock week 1 achievement (6 days completed)", async ({
    page,
  }) => {
    // Set up state with 5 days completed
    await page.evaluate(() => {
      const state = {
        currentDay: 6,
        totalXP: 500,
        streak: 5,
        maxStreak: 5,
        totalMinutes: 0,
        daysCompleted: 5,
        completedExercises: {
          "day-0": true,
          "day-1": true,
          "day-2": true,
          "day-3": true,
          "day-4": true,
        },
        dailyPracticeTime: {},
        lastPracticeDate: null,
        achievements: ["first_day", "streak_3", "xp_500"],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.goto("/?testDate=2026-01-04");
    await page.waitForSelector(".day-card");

    // Complete day 6 to reach "week 1" (6 days)
    await page.click(".complete-day-btn.incomplete");
    await page.waitForTimeout(500);

    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    expect(state.achievements).toContain("week_1");
    expect(state.daysCompleted).toBe(6);
  });

  test("achievements should persist after reload", async ({ page }) => {
    // Complete day 1 to unlock first achievement
    await page.click(".complete-day-btn.incomplete");
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForSelector(".day-card");

    // Achievement should still be unlocked
    const unlockedAchievements = page.locator(".achievement.unlocked");
    await expect(unlockedAchievements).toHaveCount(1);

    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    expect(state.achievements).toContain("first_day");
  });

  test("achievement should have visual styling when unlocked", async ({
    page,
  }) => {
    // Complete day 1
    await page.click(".complete-day-btn.incomplete");
    await page.waitForTimeout(500);

    // Check first achievement has unlocked class
    const firstAchievement = page.locator(".achievement").first();
    await expect(firstAchievement).toHaveClass(/unlocked/);
  });
});
