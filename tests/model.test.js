import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TEXT,
  rangeOf,
  createDetection,
  cancelDetection,
  initialState,
} from "../src/model.js";
const school = { ...rangeOf("한빛대학교"), category: "출신학교", fileId: "A" };
test("정확한 텍스트 범위, 카테고리와 원본 파일을 기록한다", () => {
  const { record } = createDetection([], school);
  assert.equal(record.text, "한빛대학교");
  assert.equal(record.sourceFileId, "A");
  assert.equal(record.category, "출신학교");
  assert.equal(TEXT.slice(record.start, record.end), record.text);
});
test("잘못된 범위와 중복 검출을 거부한다", () => {
  for (const range of [
    { start: -1, end: 3 },
    { start: 3, end: 3 },
    { start: 1, end: 1000 },
    { start: 0.5, end: 3 },
  ])
    assert.ok(createDetection([], { ...school, ...range }).error);
  const { records } = createDetection([], school);
  assert.ok(createDetection(records, school).error);
});
test("다른 파일에서는 취소를 제한하고 상태를 유지한다", () => {
  const { records } = createDetection([], school);
  const result = cancelDetection(records, { ...school, fileId: "B" });
  assert.equal(result.blocked, true);
  assert.equal(records[0].status, "active");
  assert.equal(records[0].sourceFileId, "A");
});
test("일부 범위 선택으로 다른 검출을 취소하지 않는다", () => {
  const { records } = createDetection([], school);
  assert.ok(cancelDetection(records, { ...school, end: school.end - 1 }).error);
  assert.equal(records[0].status, "active");
});
test("원본 파일의 취소는 대상 ID에만 반영하고 이력을 보존한다", () => {
  const a = createDetection([], school);
  const b = createDetection(a.records, {
    ...rangeOf("서울"),
    category: "출신지역",
    fileId: "A",
  });
  const { records } = cancelDetection(b.records, school);
  assert.equal(records.find((r) => r.id === a.record.id).status, "cancelled");
  assert.equal(records.find((r) => r.id === a.record.id).cancelled, true);
  assert.equal(records.find((r) => r.text === "서울").status, "active");
});
test("기능별 재시작의 데이터는 새로 초기화된다", () => {
  assert.equal(initialState(3).records.length, 0);
  assert.equal(initialState(6).records.length, 1);
  assert.equal(initialState(9).records.length, 1);
  assert.equal(initialState(0).started, false);
  assert.notEqual(initialState(6).records[0].id, initialState(6).records[0].id);
});

test("검출과 취소 이벤트는 같은 ID에 순서대로 남는다", () => {
  const created = createDetection([], school);
  const cancelled = cancelDetection(created.records, school);
  assert.deepEqual(
    cancelled.records[0].history.map((e) => e.type),
    ["detected", "cancelled"],
  );
  assert.equal(cancelled.records[0].id, created.record.id);
  assert.ok(
    cancelled.records[0].history.every(
      (e) => e.fileId === "A" && !Number.isNaN(Date.parse(e.at)),
    ),
  );
});
