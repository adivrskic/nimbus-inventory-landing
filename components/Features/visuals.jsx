/* SVGs are fully visible in static state.
   Animations add motion, highlights, and effects when row is active.

   ── Color palette (ocean theme) ──
   GRAPHICS (strokes/fills): rgba(180, 205, 230, X) — cool blue-grey on navy
   TEXT:                     rgba(220, 232, 246, X) — slightly brighter cool-light
   GOLD ACCENT:              #D4A853 + rgba(212, 168, 83, X) — unchanged
   ZONE TINTS (floorplan):   green/blue/red/purple — unchanged, read fine on navy
*/

export function ScannerSVG() {
  return (
    <svg className="feat-svg" viewBox="0 0 380 220" fill="none">
      <rect
        className="feat-frame"
        x="120"
        y="10"
        width="140"
        height="200"
        rx="12"
        stroke="rgba(180, 205, 230, 0.22)"
        strokeWidth="1.5"
      />
      <rect
        className="feat-screen"
        x="128"
        y="26"
        width="124"
        height="168"
        rx="4"
        fill="rgba(180, 205, 230, 0.05)"
      />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <rect
          key={i}
          className="feat-barline"
          x={148 + i * 7}
          y="70"
          width={i % 3 === 0 ? 4 : 2}
          height="60"
          fill="rgba(180, 205, 230, 0.35)"
        />
      ))}
      {/* Scan beam — hidden until animated */}
      <line
        className="feat-beam"
        x1="140"
        y1="80"
        x2="240"
        y2="80"
        stroke="#D4A853"
        strokeWidth="2"
        opacity="0"
      />
      <rect
        className="feat-glow"
        x="140"
        y="78"
        width="100"
        height="4"
        fill="#D4A853"
        opacity="0"
        rx="2"
      />
      {/* Result card — hidden until animated */}
      <rect
        className="feat-result"
        x="270"
        y="60"
        width="100"
        height="80"
        rx="6"
        fill="rgba(212,168,83,0.06)"
        stroke="rgba(212,168,83,0.15)"
        strokeWidth="1"
        opacity="0"
      />
      <rect
        className="feat-result-line1"
        x="282"
        y="76"
        width="60"
        height="4"
        rx="2"
        fill="rgba(180, 205, 230, 0.22)"
        opacity="0"
      />
      <rect
        className="feat-result-line2"
        x="282"
        y="88"
        width="45"
        height="4"
        rx="2"
        fill="rgba(180, 205, 230, 0.15)"
        opacity="0"
      />
      <rect
        className="feat-result-line3"
        x="282"
        y="100"
        width="70"
        height="4"
        rx="2"
        fill="rgba(180, 205, 230, 0.15)"
        opacity="0"
      />
      <circle
        className="feat-result-check"
        cx="350"
        cy="120"
        r="8"
        fill="none"
        stroke="#D4A853"
        strokeWidth="1.5"
        opacity="0"
      />
      <path
        className="feat-result-tick"
        d="M346 120 L349 123 L355 117"
        stroke="#D4A853"
        strokeWidth="1.5"
        fill="none"
        opacity="0"
      />
      <rect
        x="282"
        y="116"
        width="60"
        height="3"
        rx="1.5"
        fill="rgba(180, 205, 230, 0.12)"
        className="feat-conf-bg"
        opacity="0"
      />
      <rect
        className="feat-conf"
        x="282"
        y="116"
        width="0"
        height="3"
        rx="1.5"
        fill="#D4A853"
        opacity="0"
      />
    </svg>
  );
}

export function FloorPlanSVG() {
  return (
    <svg className="feat-svg" viewBox="0 0 380 220" fill="none">
      <rect
        className="feat-outline"
        x="30"
        y="20"
        width="320"
        height="180"
        rx="4"
        stroke="rgba(180, 205, 230, 0.22)"
        strokeWidth="1"
      />
      {[0, 1, 2].map((i) => (
        <line
          key={`v${i}`}
          className="feat-gridline"
          x1={110 + i * 80}
          y1="20"
          x2={110 + i * 80}
          y2="200"
          stroke="rgba(180, 205, 230, 0.08)"
          strokeWidth="1"
        />
      ))}
      {[0, 1].map((i) => (
        <line
          key={`h${i}`}
          className="feat-gridline"
          x1="30"
          y1={80 + i * 60}
          x2="350"
          y2={80 + i * 60}
          stroke="rgba(180, 205, 230, 0.08)"
          strokeWidth="1"
        />
      ))}
      <rect
        className="feat-zone"
        x="40"
        y="30"
        width="60"
        height="40"
        rx="3"
        fill="rgba(212,168,83,0.05)"
        stroke="rgba(212,168,83,0.1)"
        strokeWidth="1"
      />
      <rect
        className="feat-zone"
        x="40"
        y="90"
        width="60"
        height="50"
        rx="3"
        fill="rgba(100,160,120,0.05)"
        stroke="rgba(100,160,120,0.1)"
        strokeWidth="1"
      />
      <rect
        className="feat-zone"
        x="120"
        y="30"
        width="80"
        height="40"
        rx="3"
        fill="rgba(100,130,180,0.05)"
        stroke="rgba(100,130,180,0.1)"
        strokeWidth="1"
      />
      <rect
        className="feat-zone"
        x="120"
        y="90"
        width="80"
        height="50"
        rx="3"
        fill="rgba(180,100,100,0.05)"
        stroke="rgba(180,100,100,0.1)"
        strokeWidth="1"
      />
      <rect
        className="feat-zone"
        x="220"
        y="30"
        width="120"
        height="90"
        rx="3"
        fill="rgba(140,120,180,0.05)"
        stroke="rgba(140,120,180,0.1)"
        strokeWidth="1"
      />
      <rect
        className="feat-zone"
        x="40"
        y="160"
        width="300"
        height="30"
        rx="3"
        fill="rgba(180, 205, 230, 0.04)"
        stroke="rgba(180, 205, 230, 0.12)"
        strokeWidth="1"
      />
      <text
        className="feat-zlabel"
        x="70"
        y="55"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(220, 232, 246, 0.4)"
      >
        A-01
      </text>
      <text
        className="feat-zlabel"
        x="70"
        y="118"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(220, 232, 246, 0.4)"
      >
        B-01
      </text>
      <text
        className="feat-zlabel"
        x="160"
        y="55"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(220, 232, 246, 0.4)"
      >
        A-02
      </text>
      <text
        className="feat-zlabel"
        x="160"
        y="118"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(220, 232, 246, 0.4)"
      >
        B-02
      </text>
      <text
        className="feat-zlabel"
        x="280"
        y="80"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(220, 232, 246, 0.4)"
      >
        C-01
      </text>
      <text
        className="feat-zlabel"
        x="190"
        y="180"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(220, 232, 246, 0.4)"
      >
        DOCK
      </text>
      {/* Heat + cursor — animated only */}
      <circle
        className="feat-heat"
        cx="160"
        cy="110"
        r="35"
        fill="rgba(212,168,83,0.0)"
        opacity="0"
      />
      <circle
        className="feat-heat"
        cx="280"
        cy="70"
        r="25"
        fill="rgba(212,168,83,0.0)"
        opacity="0"
      />
      <circle
        className="feat-cursor"
        cx="60"
        cy="50"
        r="4"
        fill="#D4A853"
        opacity="0"
      />
      <circle
        className="feat-ping"
        cx="60"
        cy="50"
        r="4"
        fill="none"
        stroke="#D4A853"
        strokeWidth="1"
        opacity="0"
      />
    </svg>
  );
}

export function AnalyticsSVG() {
  return (
    <svg className="feat-svg" viewBox="0 0 380 220" fill="none">
      <line
        className="feat-axis"
        x1="50"
        y1="180"
        x2="350"
        y2="180"
        stroke="rgba(180, 205, 230, 0.18)"
        strokeWidth="1"
      />
      <line
        className="feat-axis"
        x1="50"
        y1="20"
        x2="50"
        y2="180"
        stroke="rgba(180, 205, 230, 0.18)"
        strokeWidth="1"
      />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          className="feat-hgrid"
          x1="50"
          y1={180 - (i + 1) * 38}
          x2="350"
          y2={180 - (i + 1) * 38}
          stroke="rgba(180, 205, 230, 0.05)"
          strokeWidth="1"
        />
      ))}
      {/* Bars — static at partial height, animate to full */}
      {[30, 52, 42, 72, 48, 64, 36, 80, 56, 68].map((h, i) => {
        const staticH = h * 0.4;
        return (
          <g key={i}>
            <rect
              className="feat-bar"
              x={70 + i * 28}
              y={180 - staticH}
              width="18"
              height={staticH}
              rx="2"
              fill="rgba(180, 205, 230, 0.18)"
            />
            <rect
              className="feat-bar-accent"
              x={70 + i * 28}
              y={180 - staticH}
              width="18"
              height="0"
              rx="2"
              fill="rgba(212,168,83,0.2)"
            />
          </g>
        );
      })}
      <polyline
        className="feat-trend"
        points="79,155 107,128 135,140 163,105 191,118 219,108 247,145 275,95 303,115 331,102"
        stroke="rgba(180, 205, 230, 0.18)"
        strokeWidth="1"
        fill="none"
      />
      {/* Animated overlay trend + peak */}
      <polyline
        className="feat-trend-accent"
        points="79,155 107,128 135,140 163,105 191,118 219,108 247,145 275,95 303,115 331,102"
        stroke="#D4A853"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="400"
        strokeDashoffset="400"
        opacity="0"
      />
      <circle
        className="feat-peak"
        cx="275"
        cy="95"
        r="4"
        fill="#D4A853"
        opacity="0"
      />
      <circle
        className="feat-peak-ring"
        cx="275"
        cy="95"
        r="4"
        fill="none"
        stroke="#D4A853"
        strokeWidth="1"
        opacity="0"
      />
      <rect
        className="feat-alert"
        x="284"
        y="72"
        width="70"
        height="22"
        rx="4"
        fill="rgba(212,168,83,0.08)"
        stroke="rgba(212,168,83,0.15)"
        strokeWidth="1"
        opacity="0"
      />
      <text
        className="feat-alert-text"
        x="319"
        y="87"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="#D4A853"
        opacity="0"
      >
        ANOMALY
      </text>
    </svg>
  );
}

export function InventorySVG() {
  return (
    <svg className="feat-svg" viewBox="0 0 380 220" fill="none">
      <rect
        className="feat-thead"
        x="20"
        y="20"
        width="340"
        height="28"
        rx="4"
        fill="rgba(180, 205, 230, 0.08)"
      />
      <text
        x="40"
        y="38"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(220, 232, 246, 0.55)"
      >
        PRODUCT
      </text>
      <text
        x="150"
        y="38"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(220, 232, 246, 0.55)"
      >
        SKU
      </text>
      <text
        x="230"
        y="38"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(220, 232, 246, 0.55)"
      >
        QTY
      </text>
      <text
        x="300"
        y="38"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(220, 232, 246, 0.55)"
      >
        LOC
      </text>
      {[
        "Oak Plank A1",
        "Vinyl Sheet V8",
        "Carpet CR-55",
        "Tile Box TB-12",
        "Adhesive AD-08",
      ].map((name, i) => (
        <g key={i} className="feat-trow">
          <rect
            className="feat-row-hl"
            x="20"
            y={56 + i * 32}
            width="340"
            height="28"
            rx="2"
            fill="rgba(212,168,83,0.06)"
            opacity="0"
          />
          <text
            x="40"
            y={74 + i * 32}
            fontSize="9"
            fontFamily="monospace"
            fill="rgba(220, 232, 246, 0.7)"
          >
            {name}
          </text>
          <text
            x="150"
            y={74 + i * 32}
            fontSize="9"
            fontFamily="monospace"
            fill="rgba(220, 232, 246, 0.4)"
          >
            FL-{String(1024 + i * 37).padStart(4, "0")}
          </text>
          <text
            x="230"
            y={74 + i * 32}
            fontSize="9"
            fontFamily="monospace"
            fill="rgba(220, 232, 246, 0.4)"
          >
            {[248, 82, 35, 164, 91][i]}
          </text>
          <text
            x="300"
            y={74 + i * 32}
            fontSize="9"
            fontFamily="monospace"
            fill="rgba(220, 232, 246, 0.4)"
          >
            {["A-03", "B-07", "C-02", "A-11", "D-04"][i]}
          </text>
        </g>
      ))}
      <rect
        className="feat-sweep"
        x="20"
        y="56"
        width="0"
        height="160"
        fill="rgba(212,168,83,0.03)"
        opacity="0"
      />
      <rect
        className="feat-select"
        x="18"
        y="56"
        width="3"
        height="28"
        rx="1.5"
        fill="#D4A853"
        opacity="0"
      />
    </svg>
  );
}

export function CycleCountSVG() {
  return (
    <svg className="feat-svg" viewBox="0 0 380 220" fill="none">
      {["A-01", "A-02", "B-01", "B-02", "C-01"].map((sec, i) => {
        const x = 30 + (i % 3) * 115;
        const y = i < 3 ? 20 : 100;
        return (
          <g key={sec} className="feat-sec">
            <rect
              x={x}
              y={y}
              width="100"
              height="65"
              rx="4"
              fill="rgba(180, 205, 230, 0.05)"
              stroke="rgba(180, 205, 230, 0.15)"
              strokeWidth="1"
            />
            <text
              x={x + 12}
              y={y + 20}
              fontSize="9"
              fontFamily="monospace"
              fill="rgba(220, 232, 246, 0.55)"
            >
              {sec}
            </text>
            <rect
              className="feat-sprog-bg"
              x={x + 12}
              y={y + 35}
              width="76"
              height="3"
              rx="1.5"
              fill="rgba(180, 205, 230, 0.12)"
            />
            <rect
              className="feat-sprog"
              x={x + 12}
              y={y + 35}
              width="0"
              height="3"
              rx="1.5"
              fill="#D4A853"
            />
            <circle
              className="feat-scheck"
              cx={x + 80}
              cy={y + 18}
              r="7"
              fill="none"
              stroke="rgba(180, 205, 230, 0.18)"
              strokeWidth="1"
            />
            <path
              className="feat-stick"
              d={`M${x + 76} ${y + 18} L${x + 79} ${y + 21} L${x + 85} ${
                y + 15
              }`}
              stroke="#D4A853"
              strokeWidth="1.5"
              fill="none"
              opacity="0"
            />
          </g>
        );
      })}
      <rect
        className="feat-oprog-bg"
        x="30"
        y="190"
        width="320"
        height="6"
        rx="3"
        fill="rgba(180, 205, 230, 0.12)"
      />
      <rect
        className="feat-oprog"
        x="30"
        y="190"
        width="0"
        height="6"
        rx="3"
        fill="#D4A853"
      />
      <text
        className="feat-opct"
        x="185"
        y="184"
        textAnchor="middle"
        fontSize="10"
        fontFamily="monospace"
        fill="#D4A853"
        opacity="0"
      >
        0%
      </text>
    </svg>
  );
}

export function LabelSVG() {
  return (
    <svg className="feat-svg" viewBox="0 0 380 220" fill="none">
      {/* Printer body */}
      <rect
        x="90"
        y="6"
        width="200"
        height="24"
        rx="4"
        fill="rgba(180, 205, 230, 0.12)"
        stroke="rgba(180, 205, 230, 0.18)"
        strokeWidth="1"
      />
      <rect
        className="feat-printer-slot"
        x="110"
        y="28"
        width="160"
        height="4"
        rx="2"
        fill="rgba(180, 205, 230, 0.22)"
      />
      {/* Printer indicator light */}
      <circle
        className="feat-printer-light"
        cx="270"
        cy="18"
        r="3"
        fill="rgba(180, 205, 230, 0.18)"
      />

      {/* Label — clips from printer slot, slides down */}
      <clipPath id="labelClip">
        <rect x="110" y="30" width="160" height="180" />
      </clipPath>
      <g clipPath="url(#labelClip)">
        <g className="feat-label-group">
          <rect
            className="feat-label-bg"
            x="115"
            y="32"
            width="150"
            height="110"
            rx="3"
            fill="rgba(180, 205, 230, 0.04)"
            stroke="rgba(180, 205, 230, 0.18)"
            strokeWidth="1"
          />
          {/* Barcode */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
            <rect
              key={i}
              className="feat-lbar"
              x={130 + i * 7}
              y="46"
              width={i % 3 === 0 ? 4 : 2}
              height="28"
              fill="rgba(180, 205, 230, 0.35)"
            />
          ))}
          {/* Label text lines */}
          <rect
            x="130"
            y="82"
            width="90"
            height="4"
            rx="2"
            fill="rgba(180, 205, 230, 0.18)"
          />
          <rect
            x="130"
            y="92"
            width="60"
            height="3"
            rx="1.5"
            fill="rgba(180, 205, 230, 0.12)"
          />
          <rect
            x="130"
            y="102"
            width="75"
            height="3"
            rx="1.5"
            fill="rgba(180, 205, 230, 0.08)"
          />
          {/* QR code block */}
          <rect
            x="230"
            y="46"
            width="24"
            height="24"
            rx="2"
            fill="rgba(180, 205, 230, 0.08)"
            stroke="rgba(180, 205, 230, 0.18)"
            strokeWidth="0.5"
          />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <rect
              key={`qr${i}`}
              x={233 + (i % 3) * 6}
              y={49 + Math.floor(i / 3) * 6}
              width="4"
              height="4"
              rx="0.5"
              fill={
                [1, 0, 1, 1, 1, 0, 0, 1, 1][i]
                  ? "rgba(180, 205, 230, 0.22)"
                  : "transparent"
              }
            />
          ))}
        </g>
      </g>

      {/* Scan verification beam — animated */}
      <rect
        className="feat-verify-beam"
        x="110"
        y="80"
        width="160"
        height="2"
        fill="#D4A853"
        opacity="0"
      />

      {/* Connecting lines from label to tags — animated */}
      <line
        className="feat-conn"
        x1="135"
        y1="142"
        x2="90"
        y2="172"
        stroke="rgba(212,168,83,0.15)"
        strokeWidth="0.5"
        strokeDasharray="3 2"
        opacity="0"
      />
      <line
        className="feat-conn"
        x1="190"
        y1="142"
        x2="190"
        y2="172"
        stroke="rgba(212,168,83,0.15)"
        strokeWidth="0.5"
        strokeDasharray="3 2"
        opacity="0"
      />
      <line
        className="feat-conn"
        x1="245"
        y1="142"
        x2="290"
        y2="172"
        stroke="rgba(212,168,83,0.15)"
        strokeWidth="0.5"
        strokeDasharray="3 2"
        opacity="0"
      />

      {/* Custom field tags — animated */}
      <rect
        className="feat-tag"
        x="50"
        y="170"
        width="80"
        height="26"
        rx="4"
        fill="rgba(212,168,83,0.06)"
        stroke="rgba(212,168,83,0.12)"
        strokeWidth="1"
        opacity="0"
      />
      <text
        className="feat-tag-t"
        x="90"
        y="187"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(212,168,83,0.6)"
        opacity="0"
      >
        LOT #4821
      </text>
      <rect
        className="feat-tag"
        x="150"
        y="170"
        width="80"
        height="26"
        rx="4"
        fill="rgba(212,168,83,0.06)"
        stroke="rgba(212,168,83,0.12)"
        strokeWidth="1"
        opacity="0"
      />
      <text
        className="feat-tag-t"
        x="190"
        y="187"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(212,168,83,0.6)"
        opacity="0"
      >
        EXP 03/27
      </text>
      <rect
        className="feat-tag"
        x="250"
        y="170"
        width="80"
        height="26"
        rx="4"
        fill="rgba(212,168,83,0.06)"
        stroke="rgba(212,168,83,0.12)"
        strokeWidth="1"
        opacity="0"
      />
      <text
        className="feat-tag-t"
        x="290"
        y="187"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="rgba(212,168,83,0.6)"
        opacity="0"
      >
        SUPPLIER
      </text>
    </svg>
  );
}
