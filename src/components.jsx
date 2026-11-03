import React from "react";
import {
  ScanText,
  Check,
  RotateCcw,
  CircleHelp,
  Sparkles,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Target,
  LockKeyhole,
  CheckCheck,
  Keyboard,
  X,
} from "lucide-react";
import { TEXT, MISSIONS } from "./model.js";
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

export function TutorialGuide({ s, m, next, previous, setRestart }) {
  return (
    <aside className="guide-column">
      <div className="course-title">
        <span className="tiny-pill">YOUR QUEST</span>
        <span>
          {String(s.step + 1).padStart(2, "0")} / {MISSIONS.length}
        </span>
      </div>
      <div className="guide-bubble">
        <div className="guide-person">
          <div className="mascot">
            <ScanText size={22} />
            <span>✦</span>
          </div>
          <div>
            <strong>
              루미 <span>온보딩 가이드</span>
            </strong>
            <small>차근차근, 함께 해봐요!</small>
          </div>
          <span className="speech-dots">•••</span>
        </div>
        {s.finished ? (
          <>
            <div className="completion-trophy">
              <Trophy size={43} />
            </div>
            <span className="step-kicker">QUEST COMPLETE</span>
            <h2>첫 QC 미션, 완주!</h2>
            <p>
              검출부터 원본 파일의 취소 규칙까지,
              <br />
              이제 실무에서도 자신 있게 시작하세요.
            </p>
            <div className="achievement">
              <CheckCheck size={19} /> QC Rookie 배지 획득
            </div>
            <button
              className="button primary full"
              onClick={() => setRestart(true)}
            >
              다른 미션 다시 연습하기 <RotateCcw size={15} />
            </button>
          </>
        ) : !s.started ? (
          <>
            <span className="step-kicker">LET’S GET STARTED</span>
            <h2>반가워요, 매니저님!</h2>
            <p>
              왼쪽의 시작 버튼을 눌러 주세요.
              <br />
              제가 다음 행동을 하나씩 알려드릴게요.
            </p>
            <div className="guide-tip">
              <Sparkles size={17} />
              <span>
                직접 해봐야 내 것이 되니까.
                <br />
                설명보다 실습에 집중했어요.
              </span>
            </div>
          </>
        ) : (
          <>
            <span className="step-kicker">
              MISSION {String(s.step + 1).padStart(2, "0")} · {m.section}
            </span>
            <h2>{m.title}</h2>
            <p>
              {s.step === 12
                ? "워크스페이스에서 한빛공사 → 파일 A를 열어 취소 결과를 확인하세요. 1·2·3번 문항을 확인하고 검토 완료를 눌러 파일 목록의 QC 완료 상태까지 확인해 보세요."
                : m.desc}
            </p>
            <div className={"mission-check " + (s.done ? "checked" : "")}>
              <span>{s.done ? <Check size={14} /> : <Target size={14} />}</span>
              <div>
                <small>이번 미션</small>
                <strong>
                  {s.step === 12
                    ? "동기화 확인 후 3개 문항 검토 완료"
                    : m.action}
                </strong>
              </div>
            </div>
            <div className="guide-controls">
              <button
                className="button icon-button light"
                aria-label="이전 단계"
                disabled={!s.history.length}
                onClick={previous}
              >
                <ArrowLeft size={16} />
              </button>
              <button
                className="button primary"
                disabled={!s.done}
                onClick={next}
              >
                {s.done
                  ? s.step === MISSIONS.length - 1
                    ? "튜토리얼 완료"
                    : "다음 단계"
                  : "미션을 완료해 주세요"}
                {s.done ? <ArrowRight size={15} /> : <LockKeyhole size={14} />}
              </button>
            </div>
            <span className="guide-foot">
              {s.done
                ? "잘했어요! 다음 미션이 기다려요."
                : "올바른 조작을 완료하면 다음 버튼이 열려요."}
            </span>
          </>
        )}
      </div>
      <div className="chapter-list">
        {["시작하기", "기본 검출", "심화 검출", "QC스페이스", "완료 확인"].map(
          (name, i) => {
            const isCurrent = m.section === name && !s.finished,
              isPast =
                s.step > MISSIONS.map((x) => x.section).lastIndexOf(name) ||
                s.finished;
            return (
              <div
                key={name}
                className={
                  (isCurrent ? "current " : "") + (isPast ? "past" : "")
                }
              >
                <span className="chapter-number">
                  {isPast ? <Check size={13} /> : i + 1}
                </span>
                <span>{name}</span>
                {isCurrent && <span className="chapter-now">진행 중</span>}
                {!isPast && !isCurrent && <LockKeyhole size={12} />}
              </div>
            );
          },
        )}
      </div>
      <div className="shortcut-card">
        <Keyboard size={18} />
        <strong>이것만 기억하세요</strong>
        <p>
          <kbd>E</kbd> + 드래그 <span>검출하기</span>
        </p>
        <p>
          <kbd>D</kbd> + 드래그 <span>검출 취소</span>
        </p>
        <small>카테고리 토글을 켜면 키 없이 검출</small>
      </div>
    </aside>
  );
}
export function ReplayDialog({ onClose, onRestart }) {
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
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
