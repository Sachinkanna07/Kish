import { test, expect, type Page } from "@playwright/test";
import {
  bookingError,
  localDate,
  recommend,
  slots,
} from "../src/services/procurement";
import { centres } from "../src/data/centres";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

async function login(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Get started", exact: true }).click();
  await page.getByRole("textbox", { name: "Mobile number" }).fill("9876543210");
  await page.getByRole("button", { name: "Continue with demo" }).click();
  await page.getByRole("textbox", { name: "Six-digit code" }).fill("123456");
  await page.getByRole("button", { name: "Verify & continue" }).click();
  await page.getByRole("textbox", { name: "Your name" }).fill("Ravi Kumar");
  await page
    .getByRole("textbox", { name: "Village", exact: true })
    .fill("Kovilpatti");
  await page.getByRole("button", { name: "Open Kish" }).click();
}
async function book(page: Page) {
  await page.getByRole("button", { name: "Book a token", exact: true }).click();
  await page.getByRole("button", { name: "Paddy", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .fill("250");
  await page.getByRole("button", { name: "Find suitable centres" }).click();
  await page
    .getByRole("button")
    .filter({ hasText: "BEST FIT FOR YOUR TRIP" })
    .click();
  await page.getByRole("button", { name: "06:00 6 available" }).click();
  await page.getByRole("button", { name: "Review booking" }).click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("heading", { name: "001" })).toBeVisible();
}
async function switchRole(page: Page, role: string) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Profile", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Demo role", exact: true })
    .selectOption(role);
}
test("farmer to centre to paid record, persistence and bilingual UI", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await page.screenshot({ path: "test-results/kish-home.png", fullPage: true });
  await book(page);
  await page.screenshot({
    path: "test-results/kish-token.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Simulate next farmer" }).click();
  await page.getByRole("button", { name: "I have arrived" }).click();
  await page.reload();
  await expect(page.getByText("In queue", { exact: false })).toBeVisible();
  await switchRole(page, "procurement_centre");
  await page.getByRole("button").filter({ hasText: "Paddy · 250 kg" }).click();
  await page.getByRole("button", { name: "Start procurement" }).click();
  await page
    .getByRole("spinbutton", { name: "Measured weight (kg)" })
    .fill("-1");
  await page.getByRole("button", { name: "Complete procurement" }).click();
  await expect(page.getByRole("alert")).toContainText("valid measured weight");
  await page
    .getByRole("spinbutton", { name: "Measured weight (kg)" })
    .fill("245");
  await page
    .getByRole("combobox", { name: "Grade", exact: true })
    .selectOption("B");
  await page.getByRole("button", { name: "Complete procurement" }).click();
  await expect(page.getByRole("heading", { name: "₹5,613.93" })).toBeVisible();
  await page.getByRole("button", { name: "Process demo payment" }).click();
  await page.getByRole("button", { name: "Record demo payment" }).click();
  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
  await switchRole(page, "farmer");
  await page.getByRole("button", { name: "Payments", exact: true }).click();
  await page.getByRole("button").filter({ hasText: "Paddy · 250 kg" }).click();
  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "தமிழ்", exact: true }).click();
  await expect(page.getByRole("heading", { name: "டோக்கன் #1" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("validation, cancel and capacity management", async ({ page }) => {
  await login(page);
  await book(page);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Book", exact: true })
    .click();
  await expect(
    page.getByText("You have an active booking", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Token", exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Cancel booking", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No active token" }),
  ).toBeVisible();
  await switchRole(page, "administration");
  await page
    .getByRole("button", { name: "Centre capacity", exact: true })
    .click();
  await page.getByLabel("Accept bookings").nth(1).uncheck();
  await switchRole(page, "farmer");
  await page.getByRole("button", { name: "Book a token", exact: true }).click();
  await page.getByRole("button", { name: "Paddy", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .fill("0");
  await expect(
    page.getByRole("button", { name: "Find suitable centres" }),
  ).toBeDisabled();
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .fill("250");
  await page.getByRole("button", { name: "Find suitable centres" }).click();
  await expect(
    page
      .getByRole("button")
      .filter({ hasText: "Kayathar Direct Purchase Centre" }),
  ).toHaveCount(0);
});
test("offline reload retains installed app shell and records", async ({
  page,
  context,
}) => {
  await login(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Vanakkam, Ravi." }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Vanakkam, Ravi." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "தமிழ்", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "வணக்கம், Ravi." }),
  ).toBeVisible();
  await context.setOffline(false);
});
test("booking rules reject closed, full, invalid and duplicate slots", () => {
  const c = centres[1],
    date = localDate(1);
  expect(
    bookingError(c, "paddy", NaN, date, "06:00", [], {}, "9876543210"),
  ).toBe("quantity");
  expect(
    bookingError(
      c,
      "paddy",
      250,
      date,
      "06:00",
      [],
      { [c.id]: { open: false, slots: 6, capacity: 1000 } },
      "9876543210",
    ),
  ).toBe("capacity");
  expect(
    bookingError(c, "paddy", 250, date, "23:00", [], {}, "9876543210"),
  ).toBe("slot");
  expect(
    slots(c, date, [], {}).every((s) => s.left === 6 && !s.past),
  ).toBeTruthy();
  expect(recommend("paddy", 250, date, [], {}, {})[0].id).toBe("kayathar");
});

test("GitHub repository subpath loads and works offline", async ({
  page,
  context,
}) => {
  const mime: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".webmanifest": "application/manifest+json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
  };
  const root = resolve("dist");
  const server = createServer(async (req, res) => {
    const path = new URL(req.url!, "http://localhost").pathname;
    if (!path.startsWith("/kish/")) {
      res.writeHead(404).end();
      return;
    }
    const file = resolve(root, path.slice("/kish/".length) || "index.html");
    if (!file.startsWith(root)) {
      res.writeHead(404).end();
      return;
    }
    try {
      res.setHeader(
        "Content-Type",
        mime[extname(file)] || "application/octet-stream",
      );
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address() as { port: number };
  try {
    await page.goto(`http://127.0.0.1:${address.port}/kish/`);
    await expect(
      page.getByRole("heading", { name: "வணக்கம். Welcome." }),
    ).toBeVisible();
    const scope = await page.evaluate(
      async () => (await navigator.serviceWorker.ready).scope,
    );
    expect(scope).toContain("/kish/");
    const manifest = await page.evaluate(async () =>
      (await fetch("manifest.webmanifest")).json(),
    );
    expect(manifest.display).toBe("standalone");
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeVisible();
    await context.setOffline(false);
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
  }
});

test("invalid mobile and code, Tamil persistence and small-screen layout", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("textbox", { name: "Mobile number" }).fill("123");
  await page.getByRole("button", { name: "Continue with demo" }).click();
  await expect(page.getByRole("alert")).toContainText("valid 10-digit");
  await page.getByRole("textbox", { name: "Mobile number" }).fill("9876543210");
  await page.getByRole("button", { name: "Continue with demo" }).click();
  await page.getByRole("textbox", { name: "Six-digit code" }).fill("000000");
  await page.getByRole("button", { name: "Verify & continue" }).click();
  await expect(page.getByRole("alert")).toContainText("Incorrect demo code");
  await page.getByRole("button", { name: "தமிழ்", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "தொடங்கலாம்", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/kish-tamil.png",
    fullPage: true,
  });
});
