// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Day Progression", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    // Use testDate=2025-12-30 (start date) so app starts on Day 1
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for app to load
    await page.waitForSelector(".day-card");
  });

  test("should start on day 1", async ({ page }) => {
    const dayNumber = await page.locator(".day-number").textContent();
    expect(dayNumber).toContain("DAG 1");
  });

  test("prev button should be disabled on day 1", async ({ page }) => {
    // On day 1, clicking prev shouldn't change anything
    await page.click("#prev-day-btn");
    const dayNumber = await page.locator(".day-number").textContent();
    expect(dayNumber).toContain("DAG 1");
  });

  test("next button should not advance without completing day 1", async ({
    page,
  }) => {
    // Use testDate=2025-12-30 (day 1 only unlocked by date)
    // Next button shouldn't advance because day 2 isn't date-unlocked yet
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");

    // Try to go to next day - should not work because day 2 isn't date-unlocked
    await page.click("#next-day-btn");

    // Should still be on day 1
    const dayNumber = await page.locator(".day-number").textContent();
    expect(dayNumber).toContain("DAG 1");
  });

  test("should advance to day 2 after completing day 1", async ({ page }) => {
    // Use testDate=2025-12-31 so day 2 is date-unlocked
    await page.goto("/?testDate=2025-12-31");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");

    // Complete day 1
    await page.click(".complete-day-btn.incomplete");

    // Now click next
    await page.click("#next-day-btn");

    // Should be on day 2
    const dayNumber = await page.locator(".day-number").textContent();
    expect(dayNumber).toContain("DAG 2");
  });

  test("should be able to navigate back to completed day", async ({ page }) => {
    // Use testDate=2025-12-31 so app starts on day 2
    await page.goto("/?testDate=2025-12-31");
    // Set up a state where day 1 is completed
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
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    // Should be on day 2
    let dayNumber = await page.locator(".day-number").textContent();
    expect(dayNumber).toContain("DAG 2");

    // Navigate back to day 1
    await page.click("#prev-day-btn");
    dayNumber = await page.locator(".day-number").textContent();
    expect(dayNumber).toContain("DAG 1");
  });

  test("day selector modal should show completed days", async ({ page }) => {
    // Complete day 1
    await page.click(".complete-day-btn.incomplete");

    // Open day selector modal
    await page.click("#select-day-btn");

    // Wait for modal
    await page.waitForSelector("#day-modal.active");

    // Check if day 1 button has 'completed' class
    const day1Btn = page.locator(".day-btn").first();
    await expect(day1Btn).toHaveClass(/completed/);
  });

  test("locked days should be disabled in selector modal", async ({ page }) => {
    // Open day selector modal
    await page.click("#select-day-btn");

    // Wait for modal
    await page.waitForSelector("#day-modal.active");

    // Day 2 should be locked (day 1 not completed)
    const day2Btn = page.locator(".day-btn").nth(1);
    await expect(day2Btn).toHaveClass(/locked/);
    await expect(day2Btn).toBeDisabled();
  });

  test("should unlock day 2 in selector after completing day 1", async ({
    page,
  }) => {
    // First set up state with day 1 completed, then load with day 2 date-unlocked
    await page.goto("/?testDate=2025-12-31");
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 100,
        streak: 1,
        maxStreak: 1,
        totalMinutes: 0,
        daysCompleted: 1,
        completedExercises: { "day-0": true },
        dailyPracticeTime: {},
        lastPracticeDate: null,
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });
    await page.reload();
    await page.waitForSelector(".day-card");

    // Open day selector modal
    await page.click("#select-day-btn");
    await page.waitForSelector("#day-modal.active");

    // Day 2 should now be unlocked (day 1 completed + date allows day 2)
    const day2Btn = page.locator(".day-btn").nth(1);
    await expect(day2Btn).not.toHaveClass(/locked/);
    await expect(day2Btn).not.toBeDisabled();
  });

  test("should select day from modal", async ({ page }) => {
    // Use testDate=2025-12-31 so day 2 is date-unlocked
    await page.goto("/?testDate=2025-12-31");
    // Set up state with day 1 completed
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 100,
        streak: 1,
        maxStreak: 1,
        totalMinutes: 0,
        daysCompleted: 1,
        completedExercises: { "day-0": true },
        dailyPracticeTime: {},
        lastPracticeDate: null,
        achievements: [],
      };
      localStorage.setItem("shredder_progress", JSON.stringify(state));
    });

    await page.reload();
    await page.waitForSelector(".day-card");

    // Open day selector modal
    await page.click("#select-day-btn");
    await page.waitForSelector("#day-modal.active");

    // Click on day 2
    await page.locator(".day-btn").nth(1).click();

    // Modal should close and day should be 2
    await expect(page.locator("#day-modal")).not.toHaveClass(/active/);
    const dayNumber = await page.locator(".day-number").textContent();
    expect(dayNumber).toContain("DAG 2");
  });

  test("completing day should update state correctly", async ({ page }) => {
    // Complete day 1
    await page.click(".complete-day-btn.incomplete");

    // Check state
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });

    expect(state.completedExercises["day-0"]).toBe(true);
    expect(state.totalXP).toBe(100);
  });

  test("should handle completing multiple days in sequence", async ({
    page,
  }) => {
    // Start on day 1
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");

    // Complete day 1
    await page.click(".complete-day-btn.incomplete");

    // Verify day 1 is completed
    let state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });
    expect(state.completedExercises["day-0"]).toBe(true);
    expect(state.daysCompleted).toBe(1);
    expect(state.totalXP).toBe(100);

    // Now reload with day 2 date to navigate there
    await page.goto("/?testDate=2025-12-31");
    await page.waitForSelector(".day-card");

    // Should be on day 2 now (date advances us)
    const dayNumber = await page.locator(".day-number").textContent();
    expect(dayNumber).toContain("DAG 2");

    // Complete day 2
    await page.click(".complete-day-btn.incomplete");

    // Verify both days completed
    state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });

    expect(state.completedExercises["day-0"]).toBe(true);
    expect(state.completedExercises["day-1"]).toBe(true);
    expect(state.daysCompleted).toBe(2);
    expect(state.totalXP).toBe(200);
  });
});

test.describe("Day Progression Date Locking", () => {
  test("should respect date-based locking for future days", async ({
    page,
  }) => {
    // Use testDate=2025-12-30 (start date, day 1 only)
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");

    // Complete day 1
    await page.click(".complete-day-btn.incomplete");

    // Open day selector
    await page.click("#select-day-btn");
    await page.waitForSelector("#day-modal.active");

    // Day 2 should be locked because the date hasn't arrived yet
    const day2Btn = page.locator(".day-btn").nth(1);
    await expect(day2Btn).toHaveClass(/locked/);
  });
});
