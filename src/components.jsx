import React, { useEffect, useRef } from "react";
import { Bukang } from "./Bukang.jsx";
import { CHAPTERS, chapterOf } from "./journey.js";
import {
  Check,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Target,
  LockKeyhole,
  X,
} from "lucide-react";
import { TEXT } from "./model.js";
export function HighlightedText({ records }) {
  const active = records
    .filter((r) => r.status === "active")
    .sort((a, b) => a.start - b.start);
  let cursor = 0;
  const nodes = [];
  for (const r of active) {
    nodes.push(TEXT.slice(cursor, r.start));
    nodes.push(
      <mark
        key={r.id}
        className={"mark " + (r.category === "출신지역" ? "blue" : "")}
        title={`${r.category} · 원본 파일 ${r.sourceFileId}`}
      >
        {TEXT.slice(r.start, r.end)}
      </mark>,
    );
    cursor = r.end;
  }
  nodes.push(TEXT.slice(cursor));
  return nodes;
}

export function TutorialGuide({
  s,
  m,
  action,
  notice,
  next,
  previous,
  setRestart,
  start,
  dismissIntro,
}) {
  const chapter = chapterOf(s.step);
  const modal = !s.started || s.finished || s.intro;
  const buttonRef = useRef(null),
    guideRef = useRef(null);
  useEffect(() => {
    if (modal) {
      buttonRef.current?.focus({ preventScroll: true });
      if (guideRef.current) guideRef.current.scrollTop = 0;
    }
  }, [modal, s.intro, s.finished]);
  const mood =
    s.finished || s.done
      ? "cheer"
      : !s.started
        ? "wave"
        : notice?.type === "error"
          ? "retry"
          : "point";
  return (
    <aside
      className={"guide-column bukang-guide " + (modal ? "guide-modal" : "")}
      ref={guideRef}
      onKeyDown={(e) => {
        if (!modal || e.key !== "Tab") return;
        const buttons = [
          ...guideRef.current.querySelectorAll("button:not(:disabled)"),
        ];
        const first = buttons[0],
          last = buttons.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      aria-label="부캉이 미션 안내"
      data-tutorial-controls
    >
      <div className="companion">
        <Bukang mood={mood} />
        <span className="companion-name">
          부캉이 <small>나의 첫 QC 동료</small>
        </span>
      </div>
      <section
        className="guide-bubble"
        role={modal ? "dialog" : undefined}
        aria-modal={modal ? "true" : undefined}
        aria-labelledby="mission-title"
      >
        <span className="step-kicker">
          {!s.started
            ? "PROLOGUE · 첫 출근을 환영해요"
            : s.finished
              ? "JOURNEY COMPLETE · 여정 완료"
              : `여정 ${chapter + 1} · 미션 ${s.step + 1} / 13`}
        </span>
        <h2 id="mission-title">
          {!s.started
            ? "반가워요, 매니저님!"
            : s.finished
              ? "첫 QC 여정, 완주!"
              : s.intro
                ? CHAPTERS[chapter].title
                : m.title}
        </h2>
        <div className="dialogue" aria-live="polite" aria-atomic="true">
          <p>
            {!s.started
              ? "안녕하세요, 매니저님! 저는 QC 바다를 함께 탐험할 상어 부캉이예요!"
              : s.finished
                ? "축하해요, 매니저님! 첫 QC 여정을 완주했어요! 검출, 취소, 원본 파일 규칙, QC스페이스 연결까지 모두 직접 해냈네요!"
                : s.intro
                  ? CHAPTERS[chapter].intro
                  : action.line}
          </p>
          {!s.started && (
            <p>
              제가 알려드리는 곳을 하나씩 눌러보세요. 첫 업무도 함께라면 어렵지
              않아요!
            </p>
          )}
        </div>
        {!s.started ? (
          <button
            ref={buttonRef}
            className="button primary full"
            onClick={start}
          >
            부캉이와 첫 업무 시작하기 <ArrowRight size={18} />
          </button>
        ) : s.intro ? (
          <button
            ref={buttonRef}
            className="button primary full"
            onClick={dismissIntro}
          >
            실습 시작 <ArrowRight size={18} />
          </button>
        ) : s.finished ? (
          <>
            <div className="earned-badges">
              {CHAPTERS.filter((c, i) => s.badges?.includes(i)).map((c) => (
                <span key={c.badge}>
                  {c.icon} {c.badge}
                </span>
              ))}
            </div>
            <p className="replay-summary">
              다시 시작하면 진행·검출 데이터·배지를 초기화하고 선택한 실습용
              데이터로 시작해요.
            </p>
            {[
              [0, "전체 여정 다시 시작"],
              [3, "기본 검출 다시 연습"],
              [6, "심화 검출 다시 연습"],
              [9, "QC스페이스 다시 연습"],
            ].map(([index, label]) => (
              <button
                ref={index === 0 ? buttonRef : undefined}
                className="button light full completion-replay"
                key={index}
                onClick={() => setRestart(index)}
              >
                {label} <RotateCcw size={15} />
              </button>
            ))}
          </>
        ) : (
          <>
            <div className={"mission-check " + (s.done ? "checked" : "")}>
              <span>{s.done ? <Check size={18} /> : <Target size={18} />}</span>
              <strong>{action.hint}</strong>
            </div>
            {notice && (
              <p className={"companion-feedback " + notice.type}>
                {notice.text}
              </p>
            )}
            {s.done && CHAPTERS[chapter].end === s.step && (
              <div className="achievement">
                {CHAPTERS[chapter].icon} {CHAPTERS[chapter].badge} 배지 획득!
              </div>
            )}
            <div className="guide-controls">
              <button
                className="button light"
                aria-label="이전 단계"
                disabled={!s.history.length}
                onClick={previous}
              >
                <ArrowLeft size={18} /> 이전
              </button>
              <button
                data-guide="next"
                className={"button primary " + (s.done ? "next-ready" : "")}
                disabled={!s.done}
                onClick={next}
              >
                {s.done
                  ? s.step === 12
                    ? "여정 완료"
                    : "다음 미션"
                  : "미션을 완료해 주세요"}
                {s.done ? <ArrowRight size={18} /> : <LockKeyhole size={16} />}
              </button>
            </div>
          </>
        )}
      </section>
      {!modal && (
        <>
          <div className="journey-map" aria-label="여정 지도">
            {CHAPTERS.map((c, i) => {
              const earned = s.badges?.includes(i);
              return (
                <div
                  className={
                    "journey-node " +
                    (earned ? "earned" : i === chapter ? "current" : "locked")
                  }
                  key={c.title}
                >
                  <span>{earned ? c.icon : i + 1}</span>
                  <div>
                    <strong>{c.title}</strong>
                    <small>
                      {earned
                        ? c.badge + " · 획득"
                        : i === chapter
                          ? "진행 중"
                          : "잠김"}
                    </small>
                  </div>
                  {earned ? (
                    <Check size={16} />
                  ) : (
                    i !== chapter && <LockKeyhole size={14} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="key-reminder">
            <kbd>E</kbd> 검출 <kbd>D</kbd> 취소{" "}
            <span>키를 유지하며 드래그</span>
          </div>
        </>
      )}
    </aside>
  );
}
export function ReplayDialog({ onClose, onRestart }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    return () => previous?.focus();
  }, []);
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        ref={dialog}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Tab") {
            const buttons = [...dialog.current.querySelectorAll("button")];
            const first = buttons[0],
              last = buttons.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
            if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="restart-title"
      >
        <button
          className="modal-close icon-button"
          aria-label="닫기"
          onClick={() => onClose()}
          autoFocus
        >
          <X size={20} />
        </button>
        <div className="journey-icon">
          <RotateCcw size={25} />
        </div>
        <h2 id="restart-title">어디부터 연습할까요?</h2>
        <p>
          선택하면 현재 진행 기록과 실습 데이터가 초기화됩니다.
          <br />
          선택한 실습에 필요한 예시 데이터로 다시 시작해요.
        </p>
        {[
          {
            index: 0,
            title: "전체 튜토리얼",
            desc: "워크스페이스 진입부터 QC 완료까지",
          },
          {
            index: 3,
            title: "기본 검출 실습",
            desc: "E 검출 · 카테고리 검출 · D 취소",
          },
          {
            index: 6,
            title: "심화 검출 실습",
            desc: "다른 파일 취소 제한과 원본 파일 취소",
          },
          {
            index: 9,
            title: "QC스페이스 연동 실습",
            desc: "파일 과업 생성과 검출 취소 동기화",
          },
        ].map((c) => (
          <button
            className="restart-option"
            key={c.index}
            onClick={() => onRestart(c.index)}
          >
            <span>
              <strong>{c.title}</strong>
              <small>{c.desc}</small>
            </span>
            <ArrowRight size={17} />
          </button>
        ))}
      </section>
    </div>
  );
}
