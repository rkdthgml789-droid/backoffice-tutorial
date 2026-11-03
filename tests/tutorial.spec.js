import { test, expect } from "@playwright/test";
async function drag(page, text, key) {
  const el = page.getByTestId("document-text");
  await el.scrollIntoViewIfNeeded();
  const points = await el.evaluate((root, text) => {
    const content = root.textContent,
      start = content.indexOf(text),
      end = start + text.length;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node,
      pos = 0,
      a,
      b;
    while ((node = walker.nextNode())) {
      const next = pos + node.textContent.length;
      if (!a && start >= pos && start < next) a = { node, offset: start - pos };
      if (end > pos && end <= next) {
        b = { node, offset: end - pos };
        break;
      }
      pos = next;
    }
    if (!a || !b) throw Error("Text not found");
    const r = document.createRange();
    r.setStart(a.node, a.offset);
    r.setEnd(a.node, a.offset + 1);
    const first = r.getBoundingClientRect();
    r.setStart(b.node, b.offset - 1);
    r.setEnd(b.node, b.offset);
    const last = r.getBoundingClientRect();
    return {
      x: first.left + 0.5,
      y: first.top + first.height / 2,
      ex: last.right - 0.5,
      ey: last.top + last.height / 2,
    };
  }, text);
  if (key) await page.keyboard.down(key);
  await page.mouse.move(points.x, points.y);
  await page.mouse.down();
  await page.mouse.move(points.ex, points.ey, { steps: 20 });
  await page.mouse.up();
  if (key) await page.keyboard.up(key);
}
const next = (page) =>
  page.getByRole("button", { name: "다음 단계", exact: true }).click();
const records = (page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("qc-academy-v1")).state.records,
  );
async function restartAt(page, name) {
  await page
    .getByRole("button", { name: "튜토리얼 다시 보기", exact: true })
    .click();
  await page.getByRole("button", { name: new RegExp(name) }).click();
}
test("전체 미션: 실제 드래그, 취소 제한, 공유 상태, QC 완료와 재시작", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.screenshot({ path: "test-results/welcome.png", fullPage: true });
  await page
    .getByRole("button", { name: "튜토리얼 시작하기", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "미션을 완료해 주세요" }),
  ).toBeDisabled();
  await page.getByTestId("workspace-nav").click();
  await next(page);
  await page.getByTestId("org").click();
  await next(page);
  await page.getByTestId("open-A").click();
  await next(page);
  // Key presses alone and unmodified drags must never complete a mission.
  await page.keyboard.press("e");
  await expect(
    page.getByRole("button", { name: "미션을 완료해 주세요" }),
  ).toBeDisabled();
  await drag(page, "한빛대학교");
  expect(await records(page)).toHaveLength(0);
  await drag(page, "한빛대학교", "e");
  await expect(
    page.getByRole("button", { name: "다음 단계", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("mark")).toHaveText("한빛대학교");
  await next(page);
  await page.getByRole("button", { name: "출신지역", exact: true }).click();
  await drag(page, "서울");
  expect(
    (await records(page)).filter((r) => r.status === "active"),
  ).toHaveLength(2);
  await next(page);
  await drag(page, "한빛대학", "d");
  expect(
    (await records(page)).filter((r) => r.status === "active"),
  ).toHaveLength(2);
  await expect(
    page.getByRole("button", { name: "미션을 완료해 주세요" }),
  ).toBeDisabled();
  await drag(page, "한빛대학교", "d");
  await expect(page.locator("mark")).toHaveText("서울");
  await next(page);
  await drag(page, "김하늘", "e");
  const original = (await records(page)).find((r) => r.text === "김하늘");
  await next(page);
  await page.getByTestId("switch-B").click();
  await drag(page, "김하늘", "d");
  await expect(page.getByRole("alert")).toContainText(
    "다른 파일에서 생성된 검출 내역입니다.",
  );
  expect((await records(page)).find((r) => r.id === original.id).status).toBe(
    "active",
  );
  await next(page);
  await page.getByTestId("switch-A").click();
  await drag(page, "김하늘", "d");
  expect((await records(page)).find((r) => r.id === original.id).status).toBe(
    "cancelled",
  );
  await next(page);
  await drag(page, "김하늘", "e");
  await next(page);
  await page.getByTestId("qc-nav").click();
  await next(page);
  await page.getByTestId("task-A").click();
  await drag(page, "김하늘", "d");
  await next(page);
  await page.getByTestId("workspace-nav").click();
  await page.getByTestId("org").click();
  await page.getByTestId("open-A").click();
  await expect(page.locator("mark")).toHaveText("서울");
  await expect(
    page.getByRole("button", { name: "검토 완료", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "2번 문항" }).click();
  await page.getByRole("button", { name: "3번 문항" }).click();
  await page.getByRole("button", { name: "검토 완료", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "QC 검수가 완료되었습니다",
  );
  await expect(page.locator(".file-row").first()).toContainText("QC 완료");
  await page
    .getByRole("button", { name: "튜토리얼 완료", exact: true })
    .click();
  await expect(page.getByText("첫 QC 미션, 완주!")).toBeVisible();
  await page.screenshot({ path: "test-results/completed.png", fullPage: true });
  await restartAt(page, "기본 검출 실습");
  expect(await records(page)).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "미션을 완료해 주세요" }),
  ).toBeDisabled();
  await drag(page, "한빛대학교", "e");
  await page.reload();
  await expect(page.locator("mark")).toHaveText("한빛대학교");
  await expect(
    page.getByRole("button", { name: "다음 단계", exact: true }),
  ).toBeEnabled();
  await page.screenshot({ path: "test-results/editor.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("카테고리 오선택, 이전 단계, 기능별 초기화", async ({ page }) => {
  await page.goto("/");
  await restartAt(page, "기본 검출 실습");
  await page.getByRole("button", { name: "출신지역", exact: true }).click();
  await drag(page, "한빛대학교", "e");
  await expect(
    page.getByRole("button", { name: "미션을 완료해 주세요" }),
  ).toBeDisabled();
  expect((await records(page))[0].category).toBe("출신지역");
  await drag(page, "한빛대학교", "d");
  await page.getByRole("button", { name: "출신지역", exact: true }).click();
  await drag(page, "한빛대학교", "e");
  await expect(
    page.getByRole("button", { name: "다음 단계", exact: true }),
  ).toBeEnabled();
  await drag(page, "한빛대학교", "d");
  await expect(
    page.getByRole("button", { name: "미션을 완료해 주세요" }),
  ).toBeDisabled();
  await drag(page, "한빛대학교", "e");
  await next(page);
  await page.getByRole("button", { name: "이전 단계", exact: true }).click();
  await expect(page.getByText("E를 누르고, 드래그!")).toBeVisible();
  await expect(page.locator("mark")).toHaveText("한빛대학교");
  await restartAt(page, "심화 검출 실습");
  expect((await records(page)).map((r) => r.text)).toEqual(["서울"]);
  await restartAt(page, "QC스페이스 연동 실습");
  expect((await records(page)).map((r) => r.text)).toEqual(["서울"]);
  await restartAt(page, "전체 튜토리얼");
  expect(await records(page)).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "미션을 완료해 주세요" }),
  ).toBeDisabled();
});
test("좁은 화면에서도 주요 UI가 넘치지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await restartAt(page, "기본 검출 실습");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
