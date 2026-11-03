export const TEXT =
  "안녕하세요. 저는 김하늘입니다. 한빛대학교에서 경영학을 전공했고, 서울에서 다양한 프로젝트에 참여했습니다.\n\n팀의 문제를 발견하고 함께 해결하는 과정에서 가장 큰 보람을 느낍니다. 고객의 목소리를 데이터로 정리하여 서비스 개선안을 제안했습니다.\n\n작은 오류도 놓치지 않는 꼼꼼함으로 한빛공사의 신뢰를 높이는 구성원이 되겠습니다.";
export const FILES = [
  {
    id: "A",
    name: "블라인드_검출결과_A.xlsx",
    kind: "블라인드",
    size: "128 KB",
  },
  { id: "B", name: "통합_검출결과_B.xlsx", kind: "통합 검토", size: "96 KB" },
];
export const CATEGORIES = ["출신학교", "출신지역", "성명"];
export function rangeOf(text) {
  const start = TEXT.indexOf(text);
  return { start, end: start + text.length };
}
export function createDetection(records, { start, end, category, fileId }) {
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end > TEXT.length ||
    start >= end ||
    !TEXT.slice(start, end).trim()
  )
    return { error: "검출할 텍스트를 드래그해 주세요." };
  if (!CATEGORIES.includes(category) || !FILES.some((f) => f.id === fileId))
    return { error: "파일과 검출 카테고리를 확인해 주세요." };
  if (
    records.some((r) => r.status === "active" && start < r.end && end > r.start)
  )
    return {
      error:
        "이미 검출된 범위와 겹칩니다. 기존 검출을 취소하거나 다른 범위를 선택해 주세요.",
    };
  const record = {
    id: crypto.randomUUID(),
    text: TEXT.slice(start, end),
    start,
    end,
    category,
    sourceFileId: fileId,
    status: "active",
    detected: true,
    cancelled: false,
    history: [{ type: "detected", fileId, at: new Date().toISOString() }],
  };
  return { records: [...records, record], record };
}
export function cancelDetection(records, { start, end, fileId }) {
  const record = records.find(
    (r) => r.status === "active" && r.start === start && r.end === end,
  );
  if (!record)
    return { error: "검출 표시된 텍스트의 전체 범위를 정확히 선택해 주세요." };
  if (record.sourceFileId !== fileId)
    return {
      error:
        "다른 파일에서 생성된 검출 내역입니다. 해당 검출을 취소하려면 원본 파일로 이동해 주세요.",
      blocked: true,
      record,
    };
  return {
    records: records.map((r) =>
      r.id === record.id
        ? {
            ...r,
            status: "cancelled",
            detected: false,
            cancelled: true,
            history: [
              ...(r.history || []),
              { type: "cancelled", fileId, at: new Date().toISOString() },
            ],
          }
        : r,
    ),
    record,
  };
}
export const MISSIONS = [
  {
    title: "워크스페이스로 출발",
    desc: "왼쪽 메뉴에서 워크스페이스를 클릭해 주세요. 모든 QC 업무가 시작되는 곳이에요.",
    target: "workspace",
    section: "시작하기",
    action: "워크스페이스 열기",
  },
  {
    title: "오늘의 기관 찾기",
    desc: "목록에서 한빛공사를 선택하세요. 기관별 파일과 QC 현황을 확인할 수 있어요.",
    target: "org",
    section: "시작하기",
    action: "한빛공사 선택",
  },
  {
    title: "첫 번째 파일 열기",
    desc: "OP 결과 파일에서 파일 A의 QC하기를 눌러 주세요. 파일명 옆에서 QC 상태도 확인해 보세요.",
    target: "fileA",
    section: "시작하기",
    action: "파일 A · QC하기",
  },
  {
    title: "E를 누르고, 드래그!",
    desc: "E 키를 누른 채 본문의 “한빛대학교”를 정확히 드래그하세요. 기본 카테고리인 출신학교로 검출됩니다.",
    target: "text",
    section: "기본 검출",
    mode: "create",
    text: "한빛대학교",
    category: "출신학교",
    action: "E + 드래그로 학교 검출",
  },
  {
    title: "카테고리를 직접 선택해요",
    desc: "상단의 출신지역 토글을 켠 다음 “서울”을 드래그하세요. 이번에는 E 키를 누르지 않아도 돼요.",
    target: "category",
    section: "기본 검출",
    mode: "category",
    text: "서울",
    category: "출신지역",
    action: "출신지역 선택 후 서울 드래그",
  },
  {
    title: "D로 검출 되돌리기",
    desc: "D 키를 누른 채 빨간 표시의 “한빛대학교” 전체를 드래그하세요. 출신지역 검출은 그대로 남아야 해요.",
    target: "text",
    section: "기본 검출",
    mode: "cancel",
    text: "한빛대학교",
    action: "D + 드래그로 학교 검출 취소",
  },
  {
    title: "원본 파일에 검출 남기기",
    desc: "파일 A에서 E 키를 누르고 “김하늘”을 드래그하세요. 이번 실습의 기본 카테고리는 성명입니다.",
    target: "text",
    section: "심화 검출",
    mode: "create",
    text: "김하늘",
    category: "성명",
    action: "파일 A에서 성명 검출",
  },
  {
    title: "다른 파일에서는 취소할 수 없어요",
    desc: "파일 B로 이동한 뒤 D + 드래그로 “김하늘” 검출을 취소해 보세요. 원본 파일이 달라 취소가 제한되어야 성공이에요.",
    target: "fileB",
    section: "심화 검출",
    mode: "block",
    text: "김하늘",
    action: "파일 B에서 취소 제한 확인",
  },
  {
    title: "원본 파일에서 취소하기",
    desc: "파일 A로 돌아와 D + 드래그로 “김하늘”을 취소하세요. 원본 파일에서만 취소할 수 있다는 규칙을 기억해 주세요.",
    target: "fileA",
    section: "심화 검출",
    mode: "cancel",
    text: "김하늘",
    action: "파일 A에서 성명 검출 취소",
  },
  {
    title: "QC스페이스에 과업 만들기",
    desc: "파일 A에서 E + 드래그로 “김하늘”을 다시 검출하세요. 해당 파일의 과업이 QC스페이스에 자동으로 생성됩니다.",
    target: "text",
    section: "QC스페이스",
    mode: "create",
    text: "김하늘",
    category: "성명",
    action: "파일 A에 검출 과업 생성",
  },
  {
    title: "QC스페이스로 이동",
    desc: "왼쪽 QC스페이스를 클릭하세요. 워크스페이스에서 생성한 파일별 과업을 확인할 수 있어요.",
    target: "qc",
    section: "QC스페이스",
    action: "QC스페이스 열기",
  },
  {
    title: "같은 데이터, 다른 작업 공간",
    desc: "파일 A의 과업 상세를 열고 D + 드래그로 “김하늘”을 취소하세요. 워크스페이스에도 동일하게 반영됩니다.",
    target: "taskA",
    section: "QC스페이스",
    mode: "taskCancel",
    text: "김하늘",
    action: "과업 상세에서 성명 검출 취소",
  },
  {
    title: "마지막으로 결과 확인",
    desc: "워크스페이스 → 한빛공사 → 파일 A의 QC하기로 돌아가세요. 성명 검출 취소가 반영되고, 서울 검출만 남아 있으면 실습 완료!",
    target: "workspace",
    section: "완료 확인",
    action: "워크스페이스에서 동기화 확인",
  },
];
export function initialState(index = 0) {
  let records = [];
  const seed = (text, category) => {
    records = createDetection(records, {
      ...rangeOf(text),
      category,
      fileId: "A",
    }).records;
  };
  if (index === 5) {
    seed("한빛대학교", "출신학교");
    seed("서울", "출신지역");
  }
  if (index >= 6) seed("서울", "출신지역");
  if ([7, 8, 10, 11, 12].includes(index)) seed("김하늘", "성명");
  if (index === 12)
    records = records.map((r) =>
      r.text === "김하늘"
        ? { ...r, status: "cancelled", detected: false, cancelled: true }
        : r,
    );
  return {
    badges: [],
    maxCompleted: 0,
    question: 1,
    viewed: [],
    intro: false,
    started: index > 0,
    step: index,
    done: false,
    finished: false,
    page:
      index < 2
        ? "home"
        : index === 2
          ? "files"
          : index === 11
            ? "qc"
            : "editor",
    fileId: "A",
    records,
    category: null,
    completedFiles: [],
    history: [],
    missionRecordId: records.find((r) => r.text === "김하늘")?.id ?? null,
  };
}
