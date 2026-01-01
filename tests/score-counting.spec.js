// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Score Counting", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    // Use testDate=2025-12-30 (start date) so app starts on Day 1
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for app to load
    await page.waitForSelector(".day-card");
  });

  test("should start with 0 XP", async ({ page }) => {
    const xpValue = await page.locator("#total-xp").textContent();
    expect(xpValue).toBe("0");
  });

  test("should start with 0 days completed", async ({ page }) => {
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    expect(state?.daysCompleted || 0).toBe(0);
  });

  test("should add 100 XP when completing a day", async ({ page }) => {
    // Click the complete day button
    await page.click(".complete-day-btn.incomplete");

    // Check XP was added
    const xpValue = await page.locator("#total-xp").textContent();
    expect(xpValue).toBe("100");
  });

  test("should increment daysCompleted when completing a day", async ({
    page,
  }) => {
    // Complete day 1
    await page.click(".complete-day-btn.incomplete");

    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });

    expect(state.daysCompleted).toBe(1);
  });

  test("should not add XP twice if clicking complete button multiple times", async ({
    page,
  }) => {
    // Click the complete day button
    await page.click(".complete-day-btn.incomplete");

    // Verify XP was added
    await expect(page.locator("#total-xp")).toHaveText("100");

    // Verify state shows day is completed
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    expect(state.completedExercises["day-0"]).toBe(true);
    expect(state.daysCompleted).toBe(1);

    // Reload to ensure UI reflects state, then verify button is disabled
    await page.reload();
    await page.waitForSelector(".day-card");

    // After reload, the button should be disabled (can't complete again)
    const button = page.locator(".complete-day-btn");
    await expect(button).toBeDisabled();

    // XP should still be 100 (not doubled)
    await expect(page.locator("#total-xp")).toHaveText("100");
  });

  test("daysCompleted should match actual completed exercises count", async ({
    page,
  }) => {
    // Complete day 1
    await page.click(".complete-day-btn.incomplete");

    // Verify the state
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });

    // Count actual completed days from completedExercises
    const actualCompleted = Object.keys(state.completedExercises).filter(
      (key) => key.startsWith("day-") && state.completedExercises[key],
    ).length;

    expect(state.daysCompleted).toBe(actualCompleted);
  });

  test("XP should reflect level progression correctly", async ({ page }) => {
    // Complete day 1
    await page.click(".complete-day-btn.incomplete");

    // Check level display (100 XP should be level 2)
    const levelText = await page.locator("#current-level").textContent();
    expect(levelText).toBe("2");
  });

  test("should show XP popup when completing a day", async ({ page }) => {
    // Complete day 1
    await page.click(".complete-day-btn.incomplete");

    // Check XP popup appears
    const popup = page.locator("#xp-popup");
    await expect(popup).toHaveClass(/active/);

    // Check popup shows correct amount
    const amount = await page.locator("#xp-amount").textContent();
    expect(amount).toBe("100");
  });

  test("daysCompleted state should be recalculated on load if out of sync", async ({
    page,
  }) => {
    // Manually set an inconsistent state
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 100,
        streak: 0,
        maxStreak: 0,
        totalMinutes: 0,
        daysCompleted: 5, // Incorrect - should be 1
        completedExercises: { "day-0": true },
        dailyPracticeTime: {},
        lastPracticeDate: null,
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    // Check if daysCompleted is corrected (this test reveals the bug)
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });

    // Count actual completed days
    const actualCompleted = Object.keys(state.completedExercises).filter(
      (key) => key.startsWith("day-") && state.completedExercises[key],
    ).length;

    // This test will FAIL with current code - revealing the bug
    expect(state.daysCompleted).toBe(actualCompleted);
  });
});
