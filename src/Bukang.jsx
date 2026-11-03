import React from "react";

// Original vector character: no remote image, font or asset dependency.
export function Bukang({ mood = "point" }) {
  return (
    <svg
      className={`bukang ${mood}`}
      viewBox="0 0 240 250"
      role="img"
      aria-label={`상어 부캉이 · ${{ wave: "인사", point: "위치 안내", cheer: "축하", retry: "응원" }[mood]}`}
    >
      <ellipse cx="120" cy="232" rx="73" ry="10" fill="#163d6b" opacity=".12" />
      <path
        d="M98 48 Q113 7 143 20 L149 62"
        fill="#328cc9"
        stroke="#246b9c"
        strokeWidth="3"
      />
      <path
        d="M74 198 L48 224 Q89 231 108 211 M143 209 Q170 233 193 220 L172 193"
        fill="#4fa8df"
        stroke="#246b9c"
        strokeWidth="3"
      />
      <g className="fin-left">
        <path
          d="M55 111 Q9 93 17 143 Q24 166 67 159"
          fill="#4fa8df"
          stroke="#246b9c"
          strokeWidth="3"
        />
      </g>
      <g className="fin-right">
        <path
          d="M179 110 Q217 70 226 91 Q233 119 184 154"
          fill="#4fa8df"
          stroke="#246b9c"
          strokeWidth="3"
        />
      </g>
      <path
        d="M48 122 C45 66 77 40 120 41 C168 38 200 74 195 135 C192 191 168 219 121 219 C72 219 47 187 48 122Z"
        fill="#67bcec"
        stroke="#246b9c"
        strokeWidth="3"
      />
      <path
        d="M65 146 C70 116 99 111 120 116 C148 111 178 127 181 155 C187 193 160 214 121 214 C83 214 58 192 65 146Z"
        fill="#f3fbff"
      />
      <ellipse cx="84" cy="109" rx="7" ry="10" fill="#183e5b" />
      <ellipse cx="156" cy="109" rx="7" ry="10" fill="#183e5b" />
      <circle cx="82" cy="106" r="2" fill="white" />
      <circle cx="154" cy="106" r="2" fill="white" />
      <ellipse cx="70" cy="131" rx="11" ry="6" fill="#f9aeba" opacity=".7" />
      <ellipse cx="171" cy="131" rx="11" ry="6" fill="#f9aeba" opacity=".7" />
      <path
        d="M98 134 Q120 160 142 134"
        fill="#e68e9a"
        stroke="#183e5b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M102 139 L109 147 L115 144 M125 144 L132 147 L138 139"
        fill="white"
      />
      <path
        d="M84 170 L113 190 L153 169"
        fill="none"
        stroke="#2c6fa0"
        strokeWidth="5"
      />
      <g transform="rotate(-8 121 194)">
        <rect
          x="103"
          y="178"
          width="39"
          height="37"
          rx="5"
          fill="white"
          stroke="#246b9c"
          strokeWidth="2"
        />
        <rect x="109" y="185" width="12" height="13" rx="3" fill="#a3ddf5" />
        <path
          d="M126 186 h10 M126 192 h9 M109 204 h25"
          stroke="#4784a7"
          strokeWidth="2"
        />
        <circle cx="122" cy="180" r="2" fill="#246b9c" />
      </g>
      {mood === "cheer" && (
        <g fill="#ffcf65">
          <path d="m25 44 4 10 11 3-11 4-4 11-4-11-10-4 10-3Z" />
          <path d="m205 22 4 10 11 3-11 4-4 11-4-11-10-4 10-3Z" />
        </g>
      )}
      {mood === "retry" && (
        <path
          d="M143 88 Q156 81 165 91 M76 90 Q86 82 96 88"
          fill="none"
          stroke="#246b9c"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
