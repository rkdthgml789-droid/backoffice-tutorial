import { MISSIONS, rangeOf } from "./model.js";
// One derived action drives dialogue, navigation guards and the tracked spotlight.
export const CHAPTERS = [
  {
    title: "나의 첫 워크스페이스",
    end: 2,
    badge: "첫 출근 완료",
    icon: "⚓",
    intro: "왼쪽 메뉴에서 출발해 첫 QC 업무 공간을 찾아볼 거예요.",
  },
  {
    title: "검출 도구 익히기",
    end: 5,
    badge: "검출 도구 입문자",
    icon: "🔎",
    intro:
      "E로 검출하고 D로 취소해요. 키를 누른 채 정확한 글자를 드래그해 볼까요?",
  },
  {
    title: "원본 파일의 비밀",
    end: 8,
    badge: "원본 파일 수호자",
    icon: "🛡",
    intro:
      "검출이 보이는 파일과 만들어진 파일은 다를 수 있어요. 직접 확인해 봐요!",
  },
  {
    title: "연결된 QC스페이스",
    end: 11,
    badge: "QC 연결 탐험가",
    icon: "🔗",
    intro:
      "워크스페이스와 QC스페이스가 같은 검출을 함께 관리하는지 확인해 봐요.",
  },
  {
    title: "첫 업무 완료",
    end: 12,
    badge: "QC Rookie",
    icon: "🏆",
    intro: "취소 결과를 확인하고 문항을 검토하면 첫 업무가 끝나요!",
  },
];
export const chapterOf = (step) => CHAPTERS.findIndex((c) => step <= c.end);
const action = (target, line, hint = "클릭", nav = null) => ({
  target,
  line,
  hint,
  nav,
});
export function currentAction(s, held = "") {
  if (s.done)
    return action(
      "next",
      s.step === 7
        ? "이번에 취소되지 않은 건 정상이에요! 파일 A에서 만든 검출은 원본 파일 A에서 취소해야 해요."
        : SUCCESS[s.step],
      "오른쪽 아래 ‘다음 미션’을 눌러주세요.",
    );
  if (s.step === 0)
    return action(
      "workspace",
      "먼저 화면 왼쪽의 ‘워크스페이스’를 눌러주세요.",
      "왼쪽 메뉴",
      "workspace",
    );
  if (s.step === 1)
    return action(
      "org",
      "오늘의 실습 기관은 ‘한빛공사’예요. 목록에서 기관명을 눌러주세요.",
      "기관 목록",
      "files",
    );
  if (s.step === 2)
    return action(
      "fileA",
      "OP 결과 파일의 파일 A, 오른쪽 ‘QC하기’를 눌러주세요.",
      "파일 A · QC하기",
      "editor:A",
    );
  if (s.step === 7 && s.fileId !== "B")
    return action(
      "fileB",
      "위쪽의 ‘파일 B’를 눌러주세요.",
      "파일 전환",
      "editor:B",
    );
  if (s.step === 8 && s.fileId !== "A")
    return action(
      "fileA",
      "위쪽의 ‘파일 A’를 눌러 돌아가 주세요.",
      "원본 파일로 돌아가기",
      "editor:A",
    );
  if (s.step === 10)
    return action(
      "qc",
      "이제 왼쪽 메뉴의 ‘QC스페이스’를 눌러주세요.",
      "왼쪽 메뉴",
      "qc",
    );
  if (s.step === 11 && s.page !== "task")
    return action(
      "taskA",
      "파일 A의 과업이 생성됐네요! 오른쪽의 ‘과업 상세’를 눌러보세요.",
      "파일 A · 과업 상세",
      "task:A",
    );
  if (s.step === 12) {
    if (s.page !== "workspace" && s.page !== "files" && s.page !== "editor")
      return action(
        "workspace",
        "마지막 확인이에요! 왼쪽 ‘워크스페이스’를 눌러주세요.",
        "왼쪽 메뉴",
        "workspace",
      );
    if (s.page === "workspace")
      return action(
        "org",
        "목록에서 ‘한빛공사’를 눌러주세요.",
        "기관 목록",
        "files",
      );
    if (s.page === "files")
      return action(
        "fileA",
        "파일 A의 ‘QC하기’를 눌러 취소 결과를 확인해 봐요.",
        "파일 A · QC하기",
        "editor:A",
      );
    const missing = [1, 2, 3].find((n) => !(s.viewed || []).includes(n));
    if (missing)
      return action(
        `question${missing}`,
        `‘김하늘’ 검출이 여기에서도 사라졌네요! 본문 위 ‘${missing}번 문항’을 눌러 내용을 확인해 주세요.`,
        "문항별 검토",
      );
    return action(
      "review",
      "문항 확인이 끝났어요. 본문 아래 ‘검토 완료’를 눌러주세요.",
      "검토 완료 → 파일 목록",
    );
  }
  if (s.step === 4 && s.category !== "출신지역")
    return action(
      "category",
      "이번에는 화면 위쪽의 ‘출신지역’을 눌러 켜주세요.",
      "출신지역 토글",
    );
  const text = [3, 5].includes(s.step)
    ? "한빛대학교"
    : s.step === 4
      ? "서울"
      : "김하늘";
  const key = [5, 7, 8, 11].includes(s.step) ? "D" : "E";
  if (s.step === 4)
    return action(
      "text",
      "좋아요! 이제 본문의 ‘서울’을 드래그해 주세요. 이번에는 E 키를 누르지 않아도 돼요.",
      "키 없이 서울 전체 드래그",
    );
  const prefix =
    s.step === 7
      ? "파일 A에서 만든 검출이 여기에도 보이네요. "
      : s.step === 11
        ? "여기에서도 같은 검출을 관리할 수 있어요. "
        : "";
  return action(
    "text",
    prefix +
      (held.includes(key)
        ? `좋아요! ${key}를 누른 상태로 본문의 ‘${text}’ 전체를 드래그해 주세요.`
        : `키보드의 ${key} 키를 누른 채 본문의 ‘${text}’ 전체를 드래그해 주세요.`),
    `${key} 유지 + ${text} 전체 드래그`,
  );
}
export const SUCCESS = [
  "좋아요! 이곳에서 기관별 QC 업무를 시작할 수 있어요.",
  "한빛공사의 파일 목록을 찾았어요. 이제 첫 파일을 열어볼까요?",
  "첫 업무 공간에 도착했어요! 이제 문장에서 검토할 정보를 찾아볼 거예요.",
  "검출 성공! 선택한 글자에 표시가 생겼죠? 이제 E 키를 놓아도 돼요.",
  "정확해요! ‘서울’이 출신지역 카테고리로 검출됐어요.",
  "학교 검출만 취소됐어요! ‘서울’ 검출은 그대로 남아 있네요.",
  "검출에는 처음 만들어진 파일 정보가 남아요. 원본 파일 A를 기억해 주세요!",
  "파일 A에서 만든 검출은 원본 파일 A에서 취소해야 해요.",
  "정확해요! 검출이 보이는 파일과 검출을 만든 파일은 다를 수 있어요.",
  "파일 A의 과업이 QC스페이스에 만들어졌어요!",
  "좋아요! 워크스페이스에서 만든 과업이 이곳에도 연결되어 있네요.",
  "취소 완료! 워크스페이스와 QC스페이스는 같은 검출 정보를 함께 보고 있어요.",
  "파일 A가 ‘QC 완료’로 바뀌었어요. 첫 업무를 끝까지 해냈네요!",
];

export function validateMissionResult(state) {
  if (!state.done) return false;
  const mission = MISSIONS[state.step];
  if (!mission.text) return true;
  const target = rangeOf(mission.text);
  const matches = state.records.filter(
    (r) => r.start === target.start && r.end === target.end,
  );
  if (["create", "category"].includes(mission.mode))
    return matches.some(
      (r) =>
        r.status === "active" &&
        r.sourceFileId === "A" &&
        r.category === mission.category,
    );
  if (["cancel", "taskCancel"].includes(mission.mode))
    return !matches.some((r) => r.status === "active");
  if (mission.mode === "block")
    return matches.some(
      (r) => r.id === state.missionRecordId && r.status === "active",
    );
  return true;
}
