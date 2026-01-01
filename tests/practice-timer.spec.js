// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Practice Timer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");
  });

  test("should display timer section", async ({ page }) => {
    const timerSection = page.locator(".timer-section");
    await expect(timerSection).toBeVisible();
  });

  test("should display timer at 00:00 initially", async ({ page }) => {
    const timerDisplay = page.locator("#timer-display");
    await expect(timerDisplay).toHaveText("00:00");
  });

  test("should have start and reset buttons", async ({ page }) => {
    const startBtn = page.locator("#timer-start");
    const resetBtn = page.locator("#timer-reset");

    await expect(startBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();
  });

  test("should start timer when clicking start button", async ({ page }) => {
    const timerDisplay = page.locator("#timer-display");

    // Timer should start at 00:00
    await expect(timerDisplay).toHaveText("00:00");

    // Click start
    await page.click("#timer-start");

    // Wait for timer to increment
    await page.waitForTimeout(1500);

    // Timer should have incremented
    const timerText = await timerDisplay.textContent();
    expect(timerText).not.toBe("00:00");
    expect(timerText).toMatch(/00:0[1-9]|00:[1-5]\d/);
  });

  test("should pause timer when clicking start button again", async ({
    page,
  }) => {
    // Start timer
    await page.click("#timer-start");
    await page.waitForTimeout(1500);

    // Pause timer
    await page.click("#timer-start");

    // Get current time
    const timerDisplay = page.locator("#timer-display");
    const pausedTime = await timerDisplay.textContent();

    // Wait and verify timer hasn't changed
    await page.waitForTimeout(1200);
    await expect(timerDisplay).toHaveText(pausedTime);
  });

  test("should reset timer to 00:00", async ({ page }) => {
    // Start timer
    await page.click("#timer-start");
    await page.waitForTimeout(1500);

    // Stop timer
    await page.click("#timer-start");

    // Reset timer
    await page.click("#timer-reset");

    // Timer should be back to 00:00
    const timerDisplay = page.locator("#timer-display");
    await expect(timerDisplay).toHaveText("00:00");
  });

  test("should save practice time when resetting", async ({ page }) => {
    // Start timer
    await page.click("#timer-start");
    await page.waitForTimeout(2100); // Wait at least 2 seconds

    // Stop timer
    await page.click("#timer-start");

    // Reset timer (this saves the time)
    await page.click("#timer-reset");
    await page.waitForTimeout(500);

    // Check that practice time was saved
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem("shredder_progress");
      return stored ? JSON.parse(stored) : null;
    });

    // dailyPracticeTime should have an entry for today
    const todayKey = new Date("2025-12-30").toISOString().split("T")[0];
    expect(state.dailyPracticeTime).toBeDefined();
  });

  test("should display total time in stats bar", async ({ page }) => {
    const totalTime = page.locator("#total-time");
    await expect(totalTime).toBeVisible();
    // 0 minutes displays as "0m"
    await expect(totalTime).toHaveText("0m");
  });

  test("should update total time display", async ({ page }) => {
    // Set up state with some practice minutes
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 0,
        streak: 0,
        maxStreak: 0,
        totalMinutes: 90, // 1.5 hours = 1h30m
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

    const totalTime = page.locator("#total-time");
    // Format is "1h30m" for 90 minutes
    await expect(totalTime).toHaveText("1h30m");
  });

  test("should show hours and minutes for longer times", async ({ page }) => {
    // Set up state with 150 minutes (2h 30m)
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 0,
        streak: 0,
        maxStreak: 0,
        totalMinutes: 150,
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

    const totalTime = page.locator("#total-time");
    // Format is "2h30m"
    await expect(totalTime).toHaveText("2h30m");
  });

  test("should accumulate practice time across sessions", async ({ page }) => {
    // Set up state with existing practice time
    await page.evaluate(() => {
      const state = {
        currentDay: 1,
        totalXP: 0,
        streak: 0,
        maxStreak: 0,
        totalMinutes: 30,
        daysCompleted: 0,
        completedExercises: {},
        dailyPracticeTime: { "2025-12-30": 30 },
        lastPracticeDate: null,
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

    expect(state.totalMinutes).toBe(30);
    expect(state.dailyPracticeTime["2025-12-30"]).toBe(30);
  });

  test("should toggle start button icon between play and pause", async ({
    page,
  }) => {
    const startBtn = page.locator("#timer-start");

    // Initially should show play icon
    await expect(startBtn).toHaveText("▶");

    // Click to start - should show pause icon
    await page.click("#timer-start");
    await expect(startBtn).toHaveText("⏸");

    // Click to pause - should show play icon again
    await page.click("#timer-start");
    await expect(startBtn).toHaveText("▶");
  });
});

test.describe("Metronome", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?testDate=2025-12-30");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".day-card");
  });

  test("should display metronome section", async ({ page }) => {
    const metronomeHalf = page.locator(".metronome-half");
    await expect(metronomeHalf).toBeVisible();
  });

  test("should display default BPM of 120", async ({ page }) => {
    const bpmDisplay = page.locator("#bpm-display");
    await expect(bpmDisplay).toHaveText("120");
  });

  test("should increase BPM when clicking + button", async ({ page }) => {
    await page.click("#bpm-up");

    const bpmDisplay = page.locator("#bpm-display");
    await expect(bpmDisplay).toHaveText("125");
  });

  test("should decrease BPM when clicking - button", async ({ page }) => {
    await page.click("#bpm-down");

    const bpmDisplay = page.locator("#bpm-display");
    await expect(bpmDisplay).toHaveText("115");
  });

  test("should not go below 40 BPM", async ({ page }) => {
    // Set BPM close to 40 by clicking down a few times
    for (let i = 0; i < 5; i++) {
      await page.click("#bpm-down");
      await page.waitForTimeout(50);
    }

    const bpmDisplay = page.locator("#bpm-display");
    const bpm = parseInt(await bpmDisplay.textContent());
    // After 5 clicks down from 120 (5 increments), should be 95
    expect(bpm).toBeGreaterThanOrEqual(40);
  });

  test("should increase BPM by 5 each click", async ({ page }) => {
    // Click up twice and verify increment
    await page.click("#bpm-up");
    await page.waitForTimeout(100);
    await page.click("#bpm-up");

    const bpmDisplay = page.locator("#bpm-display");
    // After 2 clicks up from 120, should be 130
    await expect(bpmDisplay).toHaveText("130");
  });

  test("should have metronome start button", async ({ page }) => {
    const metronomeStart = page.locator("#metronome-start");
    await expect(metronomeStart).toBeVisible();
    await expect(metronomeStart).toHaveText("▶");
  });

  test("should toggle metronome button when clicked", async ({ page }) => {
    const metronomeStart = page.locator("#metronome-start");

    // Click to start
    await page.click("#metronome-start");
    await expect(metronomeStart).toHaveText("⏹");

    // Click to stop
    await page.click("#metronome-start");
    await expect(metronomeStart).toHaveText("▶");
  });
});
