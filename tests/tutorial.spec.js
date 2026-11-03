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
async function next(page) {
  await page.getByRole("button", { name: "다음 미션", exact: true }).click();
  const intro = page.getByRole("button", { name: "실습 시작", exact: true });
  if (await intro.isVisible()) await intro.click();
}
const records = (page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("qc-academy-v1")).state.records,
  );
async function restartAt(page, name) {
  const welcome = page.getByRole("button", {
    name: "부캉이와 첫 업무 시작하기",
    exact: true,
  });
  if (await welcome.isVisible()) await welcome.click();
  await page
    .getByRole("button", { name: "튜토리얼 다시 보기", exact: true })
    .click();
  await page.getByRole("button", { name: new RegExp(name) }).click();
  const intro = page.getByRole("button", { name: "실습 시작", exact: true });
  if (await intro.isVisible()) await intro.click();
}
test("전체 미션: 실제 드래그, 취소 제한, 공유 상태, QC 완료와 재시작", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.screenshot({ path: "test-results/welcome.png", fullPage: true });
  await page
    .getByRole("button", { name: "부캉이와 첫 업무 시작하기", exact: true })
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
    page.getByRole("button", { name: "다음 미션", exact: true }),
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
  await page.getByRole("button", { name: "1번 문항" }).click();
  await page.getByRole("button", { name: "2번 문항" }).click();
  await page.getByRole("button", { name: "3번 문항" }).click();
  await page.getByRole("button", { name: "검토 완료", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "QC 검수가 완료되었습니다",
  );
  await expect(page.locator(".file-row").first()).toContainText("QC 완료");
  await page.getByRole("button", { name: "여정 완료", exact: true }).click();
  await expect(page.getByText("첫 QC 여정, 완주!")).toBeVisible();
  await page.screenshot({ path: "test-results/completed.png", fullPage: true });
  await page
    .getByRole("button", { name: "기본 검출 다시 연습", exact: true })
    .click();
  await page.getByRole("button", { name: "실습 시작", exact: true }).click();
  expect(await records(page)).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "미션을 완료해 주세요" }),
  ).toBeDisabled();
  await drag(page, "한빛대학교", "e");
  await page.reload();
  await expect(page.locator("mark")).toHaveText("한빛대학교");
  await expect(
    page.getByRole("button", { name: "다음 미션", exact: true }),
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
    page.getByRole("button", { name: "다음 미션", exact: true }),
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
    page.getByRole("button", {
      name: "부캉이와 첫 업무 시작하기",
      exact: true,
    }),
  ).toBeVisible();
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

test("프롤로그 차단, 잘못된 메뉴 재안내와 자동 세부 안내", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toContainText("상어 부캉이");
  await expect(page.locator(".sidebar")).toHaveAttribute("inert", "");
  await page
    .getByRole("button", { name: "부캉이와 첫 업무 시작하기", exact: true })
    .click();
  await page.getByTestId("qc-nav").click();
  await expect(page.locator(".panel-breadcrumb")).toContainText(
    "실습 대시보드",
  );
  await expect(page.getByRole("alert")).toContainText("워크스페이스");
  await expect(page.getByTestId("spotlight")).toHaveAttribute(
    "data-target",
    "workspace",
  );
  await page.getByTestId("workspace-nav").click();
  await expect(page.locator(".dialogue")).toContainText("기관별 QC 업무");
  await next(page);
  await expect(page.getByTestId("spotlight")).toHaveAttribute(
    "data-target",
    "org",
  );
  await restartAt(page, "기본 검출 실습");
  await page.keyboard.down("e");
  await expect(page.locator(".dialogue")).toContainText("좋아요!");
  await expect(
    page.getByRole("button", { name: "미션을 완료해 주세요" }),
  ).toBeDisabled();
  await page.keyboard.up("e");
  await drag(page, "한빛대학교", "e");
  await next(page);
  await expect(page.getByTestId("spotlight")).toHaveAttribute(
    "data-target",
    "category",
  );
  await page.getByRole("button", { name: "출신지역", exact: true }).click();
  await expect(page.locator(".dialogue")).toContainText(
    "이번에는 E 키를 누르지 않아도",
  );
  await expect(page.getByTestId("spotlight")).toHaveAttribute(
    "data-target",
    "text",
  );
  await page.reload();
  await expect(page.getByTestId("spotlight")).toHaveAttribute(
    "data-target",
    "text",
  );
  await drag(page, "서울");
  await expect(
    page.getByRole("button", { name: "다음 미션", exact: true }),
  ).toBeEnabled();
});

test("드래그 중 키를 놓았다 다시 눌러도 검출하지 않는다", async ({ page }) => {
  await page.goto("/");
  await restartAt(page, "기본 검출 실습");
  const el = page.getByTestId("document-text");
  await el.scrollIntoViewIfNeeded();
  const rect = await el.boundingBox();
  await page.keyboard.down("e");
  await page.mouse.move(rect.x + 12, rect.y + 25);
  await page.mouse.down();
  await page.mouse.move(rect.x + 90, rect.y + 25, { steps: 5 });
  await page.keyboard.up("e");
  await page.keyboard.down("e");
  await page.mouse.move(rect.x + 150, rect.y + 25, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up("e");
  await expect(page.getByRole("alert")).toContainText("키가 풀렸어요");
  expect(await records(page)).toHaveLength(0);
  await drag(page, "한빛대학교", "e");
  await expect(page.locator("mark")).toHaveText("한빛대학교");
});

test("챕터 소개·배지와 문항 세부 진행을 새로고침 후 복원한다", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "부캉이와 첫 업무 시작하기", exact: true })
    .click();
  await page.getByTestId("workspace-nav").click();
  await next(page);
  await page.getByTestId("org").click();
  await next(page);
  await page.getByTestId("open-A").click();
  await expect(page.locator(".achievement")).toContainText("첫 출근 완료");
  await page.getByRole("button", { name: "다음 미션", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("dialog")).toContainText("검출 도구 익히기");
  await expect(
    page.getByRole("button", { name: "실습 시작", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "실습 시작", exact: true }).click();
  await expect(page.locator(".journey-node.earned")).toContainText(
    "첫 출근 완료",
  );
  // Reach the existing final mission using actual interactions (no localStorage seeding).
  await drag(page, "한빛대학교", "e");
  await next(page);
  await page.getByRole("button", { name: "출신지역", exact: true }).click();
  await drag(page, "서울");
  await next(page);
  await drag(page, "한빛대학교", "d");
  await next(page);
  await drag(page, "김하늘", "e");
  await next(page);
  await page.getByTestId("switch-B").click();
  await expect(page.getByTestId("spotlight")).toHaveAttribute(
    "data-target",
    "text",
  );
  await drag(page, "김하늘", "d");
  await next(page);
  await page.getByTestId("switch-A").click();
  await drag(page, "김하늘", "d");
  await next(page);
  await drag(page, "김하늘", "e");
  await next(page);
  await page.getByTestId("qc-nav").click();
  await next(page);
  await page.getByTestId("task-A").click();
  await expect(page.getByTestId("spotlight")).toHaveAttribute(
    "data-target",
    "text",
  );
  await drag(page, "김하늘", "d");
  await next(page);
  await page.getByTestId("workspace-nav").click();
  await page.getByTestId("org").click();
  await page.getByTestId("open-A").click();
  await expect(page.getByTestId("spotlight")).toHaveAttribute(
    "data-target",
    "question1",
  );
  await page.getByRole("button", { name: "1번 문항" }).click();
  await page.getByRole("button", { name: "2번 문항" }).click();
  await page.reload();
  await expect(page.getByTestId("spotlight")).toHaveAttribute(
    "data-target",
    "question3",
  );
  await expect(page.locator(".review-footer")).toContainText("2 / 3");
  await page.getByRole("button", { name: "3번 문항" }).click();
  await page.getByRole("button", { name: "검토 완료", exact: true }).click();
  await page.getByRole("button", { name: "여정 완료", exact: true }).click();
  await expect(page.locator(".earned-badges span")).toHaveCount(5);
});

test("스포트라이트는 크기·스크롤을 추적하고 모션 감소를 지원한다", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await restartAt(page, "기본 검출 실습");
  for (const width of [1440, 1200, 1000, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByTestId("document-text").scrollIntoViewIfNeeded();
    await expect(async () => {
      const r = await page.getByTestId("document-text").boundingBox();
      const hole = page.locator("#spotlight-hole rect").last();
      expect(Number(await hole.getAttribute("x"))).toBeCloseTo(r.x - 7, 0);
      expect(Number(await hole.getAttribute("y"))).toBeCloseTo(r.y - 7, 0);
      expect(Number(await hole.getAttribute("width"))).toBeCloseTo(
        r.width + 14,
        0,
      );
    }).toPass();
  }
  expect(
    await page
      .locator(".target-pointer")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
