import React, { useLayoutEffect, useState } from "react";
const selectors = {
  workspace: '[data-testid="workspace-nav"]',
  org: '[data-testid="org"]',
  fileA: '[data-testid="switch-A"], [data-testid="open-A"]',
  fileB: '[data-testid="switch-B"]',
  qc: '[data-testid="qc-nav"]',
  taskA: '[data-testid="task-A"]',
  category: '[data-guide="category"]',
  text: '[data-testid="document-text"]',
  next: '[data-guide="next"]',
  review: '[data-guide="review"]',
  question1: '[data-guide="question1"]',
  question2: '[data-guide="question2"]',
  question3: '[data-guide="question3"]',
};
export function targetElement(target) {
  return document.querySelector(selectors[target] || "[data-guide-missing]");
}
export function Spotlight({ target, scene, hidden }) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (hidden) {
      setRect(null);
      return;
    }
    const el = targetElement(target);
    if (!el) {
      setRect(null);
      return;
    }
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ x: r.x - 7, y: r.y - 7, w: r.width + 14, h: r.height + 14 });
      });
    };
    const r = el.getBoundingClientRect();
    if (r.top < 85 || r.bottom > innerHeight - 30)
      el.scrollIntoView({ block: "center", behavior: "instant" });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(document.body);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target, scene, hidden]);
  if (hidden || !rect) return null;
  return (
    <div
      className="spotlight-layer"
      aria-hidden="true"
      data-testid="spotlight"
      data-target={target}
    >
      <svg width="100%" height="100%">
        <defs>
          <mask id="spotlight-hole">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.w}
              height={rect.h}
              rx="9"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="#101e33"
          fillOpacity=".57"
          mask="url(#spotlight-hole)"
        />
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          rx="9"
          fill="none"
          stroke="#ffce70"
          strokeWidth="3"
        />
      </svg>
      <span
        className="target-pointer"
        style={{
          left: Math.max(10, Math.min(innerWidth - 42, rect.x + rect.w - 23)),
          top: Math.max(8, rect.y - 31),
        }}
      >
        👇
      </span>
    </div>
  );
}
