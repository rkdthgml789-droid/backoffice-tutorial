import React, { useEffect, useRef, useState } from "react";
import {
  LockKeyhole,
  LayoutDashboard,
  Layers,
  ScanText,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Check,
  CheckCheck,
  FileSpreadsheet,
  Search,
  Bell,
  CircleHelp,
  ArrowLeft,
  Target,
  BookOpen,
  X,
  Keyboard,
  GraduationCap,
} from "lucide-react";
import {
  currentAction,
  CHAPTERS,
  chapterOf,
  validateMissionResult,
} from "./journey.js";
import { Spotlight, targetElement } from "./Spotlight.jsx";
import { HighlightedText, TutorialGuide, ReplayDialog } from "./components.jsx";
import {
  TEXT,
  FILES,
  CATEGORIES,
  MISSIONS,
  initialState,
  createDetection,
  cancelDetection,
  rangeOf,
} from "./model.js";
const STORE = "qc-academy-v1";
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    if (
      s?.version === 1 &&
      s.state &&
      Array.isArray(s.state.records) &&
      Number.isInteger(s.state.step) &&
      Array.isArray(s.state.history) &&
      Array.isArray(s.state.completedFiles) &&
      FILES.some((f) => f.id === s.state.fileId) &&
      ["home", "workspace", "files", "editor", "qc", "task"].includes(
        s.state.page,
      ) &&
      s.state.records.every(
        (r) =>
          Number.isInteger(r.start) &&
          Number.isInteger(r.end) &&
          r.start >= 0 &&
          r.end <= TEXT.length &&
          r.start < r.end &&
          CATEGORIES.includes(r.category) &&
          FILES.some((f) => f.id === r.sourceFileId) &&
          ["active", "cancelled"].includes(r.status),
      ) &&
      s.state.step >= 0 &&
      s.state.step < MISSIONS.length
    )
      return { ...initialState(), ...s.state };
  } catch {}
  return initialState();
}
function Logo() {
  return (
    <div className="brand">
      <span>
        findeet<span className="brand-dot">!</span>
        <small>QC ACADEMY</small>
      </span>
    </div>
  );
}
function App() {
  const [s, setS] = useState(load),
    [notice, setNotice] = useState(null),
    [restart, setRestart] = useState(false),
    [query, setQuery] = useState(""),
    [held, setHeld] = useState("");
  const question = s.question ?? 1,
    viewed = s.viewed ?? [];
  const keys = useRef(new Set()),
    gesture = useRef(null),
    bodyRef = useRef(null),
    stateRef = useRef(s);
  stateRef.current = s;
  const m = MISSIONS[s.step],
    active = s.records.filter((r) => r.status === "active"),
    file = FILES.find((f) => f.id === s.fileId),
    progress = s.finished
      ? 100
      : Math.round(((s.maxCompleted || 0) / MISSIONS.length) * 100);
  const action = currentAction(s, held);
  const guideModal = !s.started || s.finished || s.intro;
  const focus = (id) =>
    s.started && !s.finished && !s.done && action.target === id
      ? " spotlight"
      : "";
  useEffect(() => {
    if (!s.done) return;
    const chapter = chapterOf(s.step);
    setS((prev) => {
      const badges = prev.badges || [];
      const award =
        CHAPTERS[chapter].end === prev.step && !badges.includes(chapter);
      const count = Math.max(prev.maxCompleted || 0, prev.step + 1);
      if (!award && count === prev.maxCompleted) return prev;
      return {
        ...prev,
        maxCompleted: count,
        badges: award ? [...badges, chapter] : badges,
      };
    });
  }, [s.done, s.step]);
  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ version: 1, state: s }));
    } catch {
      setNotice({
        text: "브라우저 저장소를 사용할 수 없어 이번 진행 내용은 새로고침 후 유지되지 않습니다.",
        type: "info",
      });
    }
  }, [s]);
  useEffect(() => {
    function down(e) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const k = e.key.toLowerCase();
      if (["e", "d"].includes(k)) {
        keys.current.add(k);
        setHeld([...keys.current].join("+").toUpperCase());
      }
    }
    function up(e) {
      if (gesture.current?.key === e.key.toLowerCase())
        gesture.current.interrupted = true;
      keys.current.delete(e.key.toLowerCase());
      setHeld([...keys.current].join("+").toUpperCase());
    }
    function clear() {
      keys.current.clear();
      gesture.current = null;
      setHeld("");
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);
  useEffect(() => {
    setNotice(null);
  }, [s.step, s.category]);
  const say = (text, type = "info") => setNotice({ text, type });
  function navigate(page, fileId = s.fileId) {
    if (s.started && !s.finished) {
      const expected = currentAction(s).nav;
      if (expected !== page && expected !== `${page}:${fileId}`) {
        say(currentAction(s).line, "error");
        return;
      }
    }
    setS((prev) => {
      let done = prev.done;
      if (prev.started && !prev.finished) {
        if (prev.step === 0 && page === "workspace") done = true;
        if (prev.step === 1 && page === "files") done = true;
        if (prev.step === 2 && page === "editor" && fileId === "A") done = true;
        if (
          prev.step === 10 &&
          page === "qc" &&
          prev.records.some(
            (r) => r.status === "active" && r.sourceFileId === "A",
          )
        )
          done = true;
      }
      return { ...prev, page, fileId, done, question: 1, viewed: [] };
    });
    setNotice(null);
  }
  function reset(index) {
    setS({ ...initialState(index), started: index !== 0, intro: index > 0 });
    setNotice(null);
    setRestart(false);
    keys.current.clear();
    setHeld("");
    window.getSelection()?.removeAllRanges();
  }
  function next() {
    if (!validateMissionResult(s)) return;
    if (s.step === MISSIONS.length - 1) {
      setS({ ...s, finished: true });
      return;
    }
    const { history, ...snapshot } = s;
    setS({
      ...s,
      step: s.step + 1,
      done: false,
      category: null,
      intro: chapterOf(s.step + 1) !== chapterOf(s.step),
      history: [...history, snapshot],
    });
    setNotice(null);
  }
  function previous() {
    if (!s.history.length) return;
    setS({ ...s.history.at(-1), history: s.history.slice(0, -1) });
    setNotice(null);
  }
  function handleSelection() {
    const selection = window.getSelection(),
      el = bodyRef.current,
      g = gesture.current;
    gesture.current = null;
    if (
      !selection ||
      !selection.rangeCount ||
      selection.isCollapsed ||
      !g ||
      !el
    )
      return;
    const range = selection.getRangeAt(0);
    if (
      !el.contains(range.startContainer) ||
      !el.contains(range.endContainer)
    ) {
      say("본문 안의 텍스트만 선택해 주세요.", "error");
      return;
    }
    const before = range.cloneRange();
    before.selectNodeContents(el);
    before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length,
      end = start + range.toString().length;
    const now = stateRef.current;
    const mission = MISSIONS[now.step];
    const cancel = g.key === "d" && keys.current.has("d"),
      detect = g.key === "e" && keys.current.has("e");
    if (g.key && (g.interrupted || (!cancel && !detect))) {
      say(
        "키가 풀렸어요. 단축키를 누른 상태로 처음부터 다시 드래그해 주세요.",
        "error",
      );
      return;
    }
    if (!cancel && !detect && !now.category) {
      say("E 키를 누르거나 검출 카테고리를 먼저 선택해 주세요.", "error");
      return;
    }
    const category = now.category || (mission.category ?? "출신학교");
    const result = cancel
      ? cancelDetection(now.records, { start, end, fileId: now.fileId })
      : createDetection(now.records, {
          start,
          end,
          category,
          fileId: now.fileId,
        });
    const exact =
      mission.text &&
      start === rangeOf(mission.text).start &&
      end === rangeOf(mission.text).end;
    if (result.error) {
      say(
        result.error +
          (mission.text
            ? ` ‘${mission.text}’의 처음부터 끝까지 선택해 주세요.`
            : ""),
        "error",
      );
      if (
        result.blocked &&
        now.step === 7 &&
        now.fileId === "B" &&
        exact &&
        result.record.id === now.missionRecordId
      )
        setS({ ...now, done: true });
      return;
    }
    let success = false;
    if (now.started && !now.finished) {
      if (
        ["create", "category"].includes(mission.mode) &&
        !cancel &&
        exact &&
        category === mission.category &&
        now.fileId === "A" &&
        now.page === "editor"
      )
        success =
          mission.mode === "category"
            ? !detect && now.category === mission.category
            : detect;
      if (
        mission.mode === "cancel" &&
        cancel &&
        exact &&
        now.page === "editor" &&
        now.fileId === "A"
      )
        success =
          now.step === 5
            ? result.record.category === "출신학교" &&
              result.records.some(
                (r) => r.status === "active" && r.category === "출신지역",
              )
            : result.record.id === now.missionRecordId;
      if (
        mission.mode === "taskCancel" &&
        cancel &&
        exact &&
        now.page === "task" &&
        now.fileId === "A" &&
        result.record.id === now.missionRecordId
      )
        success = true;
    }
    setS({
      ...now,
      records: result.records,
      done: validateMissionResult({
        ...now,
        records: result.records,
        done: now.done || success,
      }),
      missionRecordId:
        success && [6, 9].includes(now.step)
          ? result.record.id
          : now.missionRecordId,
    });
    say(
      success
        ? "미션 성공! 올바르게 처리했어요. 다음 미션으로 이동하세요."
        : `${cancel ? "검출을 취소했어요." : "선택한 텍스트를 " + category + "로 검출했어요."} ${now.started && !now.done && !success ? "잘못 검출했다면 D로 같은 범위를 취소한 뒤 안내된 카테고리와 텍스트로 다시 시도해 주세요." : ""}`,
      success ? "success" : "info",
    );
    selection.removeAllRanges();
  }
  function reviewComplete() {
    if (viewed.length !== 3) return;
    const valid =
      s.step === 12 &&
      s.fileId === "A" &&
      s.page === "editor" &&
      !s.records.some((r) => r.status === "active" && r.text === "김하늘") &&
      s.records.some((r) => r.status === "active" && r.text === "서울");
    setS({
      ...s,
      done: s.done || valid,
      page: "files",
      completedFiles: [...new Set([...s.completedFiles, s.fileId])],
    });
    say(
      "QC 검수가 완료되었습니다. 파일 목록에 완료 상태가 반영되었어요.",
      "success",
    );
  }
  const workspaceLink = (
    <>
      <span>워크스페이스</span>
      <ChevronRight size={14} />
      <span>한빛공사</span>
    </>
  );
  return (
    <div
      className="app-shell"
      onClickCapture={(e) => {
        const controls = e.target.closest(
          "[data-tutorial-controls], .modal-backdrop, [data-replay-control]",
        );
        if (controls) return;
        if (guideModal) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const button = e.target.closest("button, input");
        if (!button || !s.started || s.finished) return;
        const target = targetElement(action.target);
        // Recovery tools remain available for wrong categories or accidental detections.
        const recovery =
          (action.target === "text" || (s.done && m.text)) &&
          button.closest(".category-bar");
        if (target?.contains(button) || button === target || recovery) return;
        e.preventDefault();
        e.stopPropagation();
        say(action.line, "error");
      }}
    >
      <Spotlight
        target={action.target}
        scene={s.page + s.step}
        hidden={guideModal || restart}
      />
      {guideModal && <div className="intro-backdrop" aria-hidden="true" />}
      <aside
        className="sidebar"
        inert={guideModal || restart ? true : undefined}
        aria-hidden={guideModal || restart ? true : undefined}
      >
        <Logo />
        <div className="space-label">MANAGER WORKSPACE</div>
        <nav aria-label="주 메뉴">
          <button
            onClick={() => navigate("home")}
            className={s.page === "home" ? "selected" : ""}
          >
            <LayoutDashboard size={18} /> 홈
          </button>
          <button
            onClick={() => navigate("workspace")}
            className={
              (s.page === "workspace" ||
              s.page === "files" ||
              s.page === "editor"
                ? "selected"
                : "") + focus("workspace")
            }
            data-testid="workspace-nav"
          >
            <Layers size={18} /> 워크스페이스{" "}
            <span className="nav-count">2</span>
          </button>
          {["files", "editor"].includes(s.page) && (
            <div className="nav-submenu">
              <span>워크스페이스 상세</span>
              <span>QC 워크스페이스</span>
              <span>작업실</span>
            </div>
          )}
          <button
            onClick={() => navigate("qc")}
            className={
              (s.page === "qc" || s.page === "task" ? "selected" : "") +
              focus("qc")
            }
            data-testid="qc-nav"
          >
            <ScanText size={18} /> QC스페이스
          </button>
        </nav>
        <div className="sidebar-course">
          <span className="tiny-pill">LEARNING MODE</span>
          <GraduationCap size={26} />
          <h4>실수해도 괜찮아요.</h4>
          <p>
            이곳은 나만의 실습실!
            <br />
            모든 데이터는 가상입니다.
          </p>
          <div className="mini-progress">
            <i style={{ width: progress + "%" }} />
          </div>
          <small>{progress}% 학습 완료</small>
        </div>
        <button
          className="help-link"
          data-replay-control
          onClick={() => setRestart(true)}
        >
          <CircleHelp size={17} /> 튜토리얼 센터
        </button>
        <div className="profile">
          <div className="avatar">김</div>
          <div>
            <strong>김큐씨 매니저</strong>
            <small>신입 QC 매니저</small>
          </div>
          <span className="online" />
        </div>
      </aside>
      <div className="main-shell">
        <header
          className="topbar"
          inert={guideModal || restart ? true : undefined}
          aria-hidden={guideModal || restart ? true : undefined}
        >
          <div className="breadcrumb">
            <BookOpen size={15} /> 실습실 <ChevronRight size={13} />
            <strong>백오피스 QC 온보딩</strong>
          </div>
          <div className="top-actions">
            <span className="sandbox">
              <i /> 가상 데이터 모드
            </span>
            <button
              className="icon-button"
              aria-label="도움말"
              onClick={() =>
                say(
                  "키보드 E: 검출 · D: 취소. 키를 누른 채 텍스트를 드래그하세요. 카테고리를 켜면 키 없이 검출할 수 있어요.",
                )
              }
            >
              <CircleHelp size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="알림"
              onClick={() =>
                say("실제 지원자 정보나 외부 시스템은 연결되어 있지 않습니다.")
              }
            >
              <Bell size={19} />
            </button>
          </div>
        </header>
        <main>
          <div
            className="page-heading"
            inert={guideModal || restart ? true : undefined}
          >
            <div>
              <div className="eyebrow">LEARN BY DOING</div>
              <h1>
                부캉이와 함께하는 첫 QC 업무<span> ✦</span>
              </h1>
              <p>
                첫 QC부터 검출 관리까지. 작은 미션으로 시작하는 나의 첫 업무.
              </p>
            </div>
            <button
              className="button light"
              data-replay-control
              onClick={() => setRestart(true)}
            >
              <RotateCcw size={15} /> 튜토리얼 다시 보기
            </button>
          </div>
          <section
            className="journey"
            inert={guideModal || restart ? true : undefined}
          >
            <div className="journey-icon">
              <Target size={22} />
            </div>
            <div className="journey-copy">
              <strong>신입 QC 매니저의 첫 업무 탐험</strong>
              <span>
                QC 검출 마스터하기 <b>· 약 10분</b>
              </span>
            </div>
            <div className="journey-progress">
              <div>
                <span>나의 학습 진행률</span>
                <strong>
                  {progress}
                  <small>%</small>
                </strong>
              </div>
              <div className="progress">
                <i style={{ width: progress + "%" }} />
              </div>
            </div>
            <div className="journey-count">
              {s.finished ? "완료" : String(s.step + 1).padStart(2, "0")}
              <span> / {MISSIONS.length}</span>
            </div>
          </section>
          <div className="work-layout">
            <section
              className="workspace-panel"
              inert={guideModal || restart ? true : undefined}
              aria-hidden={guideModal || restart ? true : undefined}
            >
              <div className="panel-top">
                <div className="panel-breadcrumb">
                  {s.page === "home" ? (
                    <span>실습 대시보드</span>
                  ) : s.page === "workspace" ? (
                    <span>워크스페이스</span>
                  ) : (
                    <>
                      {workspaceLink}
                      <ChevronRight size={14} />
                      <strong>
                        {s.page === "qc"
                          ? "QC스페이스"
                          : s.page === "files"
                            ? "워크스페이스 상세"
                            : s.page === "task"
                              ? "과업 상세"
                              : "파일 QC"}
                      </strong>
                    </>
                  )}
                </div>
                <span className="demo-tag">PRACTICE</span>
              </div>
              {s.page === "home" && (
                <div className="welcome">
                  <div className="welcome-art">
                    <div className="art-paper">
                      <ScanText size={52} />
                      <i />
                      <i />
                      <i />
                      <span>
                        <Check size={25} />
                      </span>
                    </div>
                    <span className="spark s1">✦</span>
                    <span className="spark s2">✧</span>
                    <span className="art-pill">READY TO QC</span>
                  </div>
                  <span className="tiny-pill coral">WELCOME, NEW MANAGER</span>
                  <h2>
                    좋은 QC의 시작,
                    <br />첫 실습을 함께해요.
                  </h2>
                  <p>
                    문장에서 검출할 정보를 찾고, 직접 표시해 보세요.
                    <br />
                    상어 부캉이가 모든 과정을 함께할게요.
                  </p>
                  <div className="welcome-features">
                    <span>
                      <Check size={14} /> 실제 조작으로 학습
                    </span>
                    <span>
                      <Check size={14} /> 부담 없는 가상 데이터
                    </span>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => navigate("workspace")}
                  >
                    워크스페이스 열기
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {s.page === "workspace" && (
                <div className="panel-body">
                  <div className="section-title">
                    <div>
                      <h2>워크스페이스</h2>
                      <p>기관을 선택하고 QC 업무를 시작하세요.</p>
                    </div>
                    <span className="soft-tag">전체 1개</span>
                  </div>
                  <div className="workspace-summary">
                    <div>
                      워크스페이스
                      <strong>
                        1 <small>개</small>
                      </strong>
                    </div>
                    <div>
                      지원자
                      <strong>
                        1 <small>명</small>
                      </strong>
                    </div>
                    <div>
                      기관수
                      <strong>
                        1 <small>곳</small>
                      </strong>
                    </div>
                  </div>
                  <div className="toolbar">
                    <span className="tab active">
                      전체 기관 <b>1</b>
                    </span>
                    <label className="search">
                      <Search size={16} />
                      <input
                        aria-label="기관 검색"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="기관명 검색"
                      />
                    </label>
                  </div>
                  <div className="table-head org-grid">
                    <span>기관명</span>
                    <span>공고명</span>
                    <span>인원수</span>
                    <span>상태</span>
                    <span />
                  </div>
                  {"한빛공사".includes(query) ? (
                    <button
                      className={"org-row org-grid" + focus("org")}
                      onClick={() => navigate("files")}
                      data-testid="org"
                    >
                      <span className="org-name">
                        <span className="org-icon">H</span>
                        <span>
                          <strong>한빛공사</strong>
                          <small>2026년 신입사원 공개채용</small>
                        </span>
                      </span>
                      <span>2026년 신입사원 공개채용</span>
                      <span>1명</span>
                      <span className="status orange">QC 중</span>
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <div className="empty">검색 결과가 없습니다.</div>
                  )}
                  <div className="info-box">
                    <CircleHelp size={16} /> 기관별로 파일과 검출 결과가
                    관리됩니다. 실습 기관은 한빛공사입니다.
                  </div>
                </div>
              )}
              {s.page === "files" && (
                <div className="panel-body">
                  <div className="section-title">
                    <div>
                      <span className="eyebrow">WORKSPACE DETAIL</span>
                      <h2>
                        한빛공사 <span className="soft-tag">2026 공개채용</span>
                      </h2>
                      <p>OP 결과 파일에서 검토할 파일의 QC하기를 클릭하세요.</p>
                    </div>
                    <span className="org-icon large">H</span>
                  </div>
                  <div className="stats">
                    <div>
                      <small>전체 파일</small>
                      <strong>02</strong>
                    </div>
                    <div>
                      <small>QC 진행 중</small>
                      <strong>
                        {2 - s.completedFiles.length}
                        <em>개</em>
                      </strong>
                    </div>
                    <div>
                      <small>QC 완료</small>
                      <strong className="green">
                        {s.completedFiles.length}
                        <em>개</em>
                      </strong>
                    </div>
                  </div>
                  <h3 className="subheading">
                    원본 파일 <span>1</span>
                  </h3>
                  <div className="source-files">
                    <FileSpreadsheet size={17} />
                    <span>한빛공사_가상지원자.xlsx</span>
                    <span className="status green-bg">처리 완료</span>
                    <span>2026-11-03</span>
                  </div>
                  <div className="company-note">
                    메모 · 실습용 가상 데이터입니다. 실제 지원자 정보는 포함하지
                    않습니다.
                  </div>
                  <h3 className="subheading">
                    OP 결과 파일 <span>2</span>
                  </h3>
                  <div className="table-head file-grid">
                    <span>파일명</span>
                    <span>파일 크기</span>
                    <span>최근 수정</span>
                    <span>작업</span>
                  </div>
                  {FILES.map((f) => (
                    <div className="file-row file-grid" key={f.id}>
                      <div className="file-name">
                        <FileSpreadsheet size={20} />
                        <div>
                          <strong>{f.name}</strong>
                          <small>
                            <span
                              className={
                                "status " +
                                (s.completedFiles.includes(f.id)
                                  ? "green-bg"
                                  : "orange")
                              }
                            >
                              {s.completedFiles.includes(f.id)
                                ? "QC 완료"
                                : s.records.some((r) => r.sourceFileId === f.id)
                                  ? "QC 진행 중"
                                  : "QC 진행 전"}
                            </span>{" "}
                            파일 {f.id}
                          </small>
                        </div>
                      </div>
                      <span className="muted">{f.size}</span>
                      <span className="muted file-date">2026-11-03</span>
                      <button
                        className={
                          "button compact light" + focus("file" + f.id)
                        }
                        onClick={() => navigate("editor", f.id)}
                        data-testid={"open-" + f.id}
                      >
                        QC하기 <ArrowRight size={13} />
                      </button>
                    </div>
                  ))}
                  <div className="info-box">
                    <CheckCheck size={17} /> 파일을 이동해도 검출 내역과 원본
                    파일 정보는 유지됩니다.
                  </div>
                </div>
              )}
              {(s.page === "editor" || s.page === "task") && (
                <div className="editor">
                  <div className="qc-summary">
                    <span>
                      QC 진행도{" "}
                      <strong>
                        {s.completedFiles.includes(s.fileId)
                          ? "1 / 1"
                          : "0 / 1"}
                      </strong>
                    </span>
                    <span>
                      미검출 <strong>{active.length ? "0명" : "1명"}</strong>
                    </span>
                    <span>
                      최종 검출 <strong>{active.length ? "1명" : "0명"}</strong>
                    </span>
                  </div>
                  <div className="editor-header">
                    <button
                      className="text-button"
                      onClick={() =>
                        navigate(s.page === "task" ? "qc" : "files")
                      }
                    >
                      <ArrowLeft size={14} />{" "}
                      {s.page === "task" ? "과업 목록" : "워크스페이스 상세"}
                    </button>
                    <span className="status orange">
                      {s.page === "task" ? "과업 검토 중" : "QC 진행 중"}
                    </span>
                  </div>
                  <div className="file-switch">
                    <div>
                      <FileSpreadsheet size={18} />
                      <strong>{file.name}</strong>
                    </div>
                    <div>
                      {FILES.map((f) => (
                        <button
                          key={f.id}
                          className={
                            (s.fileId === f.id ? "active" : "") +
                            focus("file" + f.id)
                          }
                          onClick={() => navigate(s.page, f.id)}
                          data-testid={"switch-" + f.id}
                        >
                          파일 {f.id}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={"category-bar" + focus("category")}>
                    <span>검출 카테고리</span>
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        className={s.category === c ? "active" : ""}
                        data-guide={c === "출신지역" ? "category" : undefined}
                        aria-pressed={s.category === c}
                        onClick={() =>
                          setS({ ...s, category: s.category === c ? null : c })
                        }
                      >
                        {c}
                      </button>
                    ))}
                    <span className="key-state">
                      {held ? (
                        <>
                          <Keyboard size={13} />
                          {held} 누르는 중
                        </>
                      ) : (
                        <>
                          <Keyboard size={13} /> 단축키 사용 가능
                        </>
                      )}
                    </span>
                  </div>
                  <div className="document-layout">
                    <aside className="applicants">
                      <small>
                        지원자 <b>1</b>
                      </small>
                      <div className="applicant selected">
                        <div className="avatar peach">01</div>
                        <strong>
                          지원자 001<small>일반행정 · 신입</small>
                        </strong>
                        {s.completedFiles.includes(s.fileId) && (
                          <CheckCheck size={16} className="green" />
                        )}
                      </div>
                      <div className="applicant-note">
                        가상 지원자
                        <br />
                        개인정보가 아닌
                        <br />
                        실습용 예시입니다.
                      </div>
                    </aside>
                    <article className="document">
                      <div className="doc-heading">
                        <span>자기소개서</span>
                        <span className="muted">지원번호 HB-2026-001</span>
                      </div>
                      <div className="question-tabs">
                        {[1, 2, 3].map((n) => (
                          <button
                            key={n}
                            data-guide={"question" + n}
                            className={question === n ? "active" : ""}
                            onClick={() => {
                              setS({
                                ...s,
                                question: n,
                                viewed: [...new Set([...viewed, n])],
                              });
                            }}
                          >
                            {n}번 문항{" "}
                            {viewed.includes(n) && <Check size={11} />}
                          </button>
                        ))}
                      </div>
                      <h3>
                        {question === 1
                          ? "지원 동기와 본인의 강점을 소개해 주세요."
                          : question === 2
                            ? "협업을 통해 문제를 해결한 경험을 소개해 주세요."
                            : "입사 후 이루고 싶은 목표를 알려 주세요."}
                      </h3>
                      <span className="doc-meta">
                        공유 검토 본문 · {TEXT.length}자{" "}
                        <span>파일 A · B 공통 지원자</span>
                      </span>
                      <div
                        className={"selectable-text" + focus("text")}
                        ref={bodyRef}
                        data-testid="document-text"
                        onPointerDown={(e) => {
                          if (
                            (action.target !== "text" && !(s.done && m.text)) ||
                            guideModal
                          ) {
                            e.preventDefault();
                            say(action.line, "error");
                            return;
                          }
                          window.getSelection()?.removeAllRanges();
                          gesture.current = {
                            key: keys.current.has("d")
                              ? "d"
                              : keys.current.has("e")
                                ? "e"
                                : null,
                          };
                        }}
                        onPointerUp={handleSelection}
                      >
                        <HighlightedText records={s.records} />
                      </div>
                      <div className="document-footer">
                        <span>
                          <span className="dot red" /> 출신학교 · 성명{" "}
                          <span className="dot blue-dot" /> 출신지역
                        </span>
                        <span>마우스로 텍스트를 선택하세요</span>
                      </div>
                      {s.page === "editor" && (
                        <div className="review-footer">
                          <span>
                            문항 확인 <strong>{viewed.length} / 3</strong>
                          </span>
                          <button
                            className="button light compact"
                            data-guide="review"
                            disabled={viewed.length !== 3}
                            onClick={reviewComplete}
                          >
                            검토 완료 <CheckCheck size={14} />
                          </button>
                        </div>
                      )}
                    </article>
                    <div className="detection-list">
                      <div className="subheading">
                        검출 내역 <span>{active.length}</span>
                        <small>모든 파일 · QC스페이스 동기화</small>
                      </div>
                      {active.length ? (
                        active.map((r) => (
                          <div className="detection-row" key={r.id}>
                            <span
                              className={
                                "category-label " +
                                (r.category === "출신지역" ? "blue-label" : "")
                              }
                            >
                              {r.category}
                            </span>
                            <strong>{r.text}</strong>
                            <span className="muted">
                              범위 {r.start}–{r.end}
                            </span>
                            <span className="source">
                              {r.sourceFileId !== s.fileId && (
                                <LockKeyhole size={12} />
                              )}{" "}
                              원본 파일 {r.sourceFileId}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="empty small">
                          검출 내역이 없습니다. 텍스트를 드래그해 첫 검출을
                          만들어 보세요.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {s.page === "qc" && (
                <div className="panel-body">
                  <div className="section-title">
                    <div>
                      <span className="eyebrow">SHARED QC TASKS</span>
                      <h2>QC스페이스 상세</h2>
                      <p>
                        한빛공사 · 워크스페이스에서 생성된 파일별 과업입니다.
                      </p>
                    </div>
                    <ScanText size={30} className="muted" />
                  </div>
                  <div className="info-box">
                    <Layers size={16} /> 같은 검출 데이터로 연결되어 있어요.
                    과업 상세에서 취소해도 워크스페이스에 반영됩니다.
                  </div>
                  <h3 className="subheading">파일별 과업</h3>
                  {FILES.filter((f) =>
                    s.records.some((r) => r.sourceFileId === f.id),
                  ).map((f) => (
                    <div className="task-row" key={f.id}>
                      <FileSpreadsheet size={23} />
                      <div>
                        <strong>
                          파일 {f.id} · {f.name}
                        </strong>
                        <small>
                          활성 검출{" "}
                          {active.filter((r) => r.sourceFileId === f.id).length}
                          건 · 취소{" "}
                          {
                            s.records.filter(
                              (r) => r.sourceFileId === f.id && r.cancelled,
                            ).length
                          }
                          건
                        </small>
                      </div>
                      <button
                        className={
                          "button light compact" + focus("task" + f.id)
                        }
                        onClick={() => navigate("task", f.id)}
                        data-testid={"task-" + f.id}
                      >
                        과업 상세 <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                  {!s.records.length && (
                    <div className="empty">
                      아직 생성된 과업이 없습니다. 워크스페이스에서 먼저 검출해
                      주세요.
                    </div>
                  )}
                </div>
              )}
            </section>
            <TutorialGuide
              s={s}
              m={m}
              action={action}
              notice={notice}
              start={() => setS({ ...s, started: true })}
              dismissIntro={() => setS({ ...s, intro: false })}
              next={next}
              previous={previous}
              setRestart={(index) =>
                typeof index === "number" ? reset(index) : setRestart(index)
              }
            />
          </div>
          {notice && !guideModal && (
            <div
              data-tutorial-controls
              className={"notice " + notice.type}
              role={notice.type === "error" ? "alert" : "status"}
            >
              <span>
                {notice.type === "success" ? (
                  <CheckCheck size={18} />
                ) : (
                  <CircleHelp size={18} />
                )}
              </span>
              <p>{notice.text}</p>
              <button aria-label="알림 닫기" onClick={() => setNotice(null)}>
                <X size={16} />
              </button>
            </div>
          )}
          <footer className="page-footer">
            <span>
              © 2026 QC Academy. Learning starts with a little practice.
            </span>
            <span>
              <span className="dot" /> PDF 1–7페이지 참고 · 가상 데이터 실습
            </span>
          </footer>
        </main>
      </div>
      {restart && (
        <ReplayDialog onClose={() => setRestart(false)} onRestart={reset} />
      )}
    </div>
  );
}
export default App;
