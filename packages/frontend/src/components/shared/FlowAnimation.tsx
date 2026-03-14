"use client"

export function FlowAnimation() {
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 1000 200"
        width="100%"
        style={{ minWidth: 700 }}
        className="block"
      >
        <defs>
          <filter id="glow-indigo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-violet" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.03); opacity: 0.6; }
          }
          .node { animation: fadeSlideIn 0.5s ease-out both; }
          .node-1 { animation-delay: 0ms; }
          .node-2 { animation-delay: 150ms; }
          .node-3 { animation-delay: 300ms; }
          .node-4 { animation-delay: 450ms; }
          .node-5 { animation-delay: 600ms; }
          .pulse-border {
            animation: pulse 2s ease-in-out infinite;
            transform-origin: 90px 100px;
          }
          .connection-line { stroke-dasharray: 4 4; opacity: 0.3; }
        `}</style>

        {/* Connection lines */}
        <path d="M 185 100 C 195 80, 205 80, 215 100" fill="none" stroke="#4f46e5" strokeWidth="2" className="connection-line" />
        <path d="M 385 100 C 395 80, 405 80, 415 100" fill="none" stroke="#7c3aed" strokeWidth="2" className="connection-line" />
        <path d="M 585 100 C 595 80, 605 80, 615 100" fill="none" stroke="#3b82f6" strokeWidth="2" className="connection-line" />
        <path d="M 785 100 C 795 80, 805 80, 815 100" fill="none" stroke="#f59e0b" strokeWidth="2" className="connection-line" />

        {/* Animated dots */}
        {[0, 0.6, 1.2].map((delay, i) => (
          <circle key={`d1-${i}`} r="4" fill="#4f46e5" filter="url(#glow-indigo)">
            <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${delay}s`} path="M 185 100 C 195 80, 205 80, 215 100" />
            <animate attributeName="fill" values="#4f46e5;#7c3aed" dur="1.8s" repeatCount="indefinite" begin={`${delay}s`} />
          </circle>
        ))}
        {[0.3, 0.9, 1.5].map((delay, i) => (
          <circle key={`d2-${i}`} r="4" fill="#7c3aed" filter="url(#glow-violet)">
            <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${delay}s`} path="M 385 100 C 395 80, 405 80, 415 100" />
            <animate attributeName="fill" values="#7c3aed;#3b82f6" dur="1.8s" repeatCount="indefinite" begin={`${delay}s`} />
          </circle>
        ))}
        {[0.6, 1.2, 1.8].map((delay, i) => (
          <circle key={`d3-${i}`} r="4" fill="#3b82f6" filter="url(#glow-blue)">
            <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${delay}s`} path="M 585 100 C 595 80, 605 80, 615 100" />
            <animate attributeName="fill" values="#3b82f6;#f59e0b" dur="1.8s" repeatCount="indefinite" begin={`${delay}s`} />
          </circle>
        ))}
        {[0.9, 1.5, 2.1].map((delay, i) => (
          <circle key={`d4-${i}`} r="4" fill="#f59e0b" filter="url(#glow-amber)">
            <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${delay}s`} path="M 785 100 C 795 80, 805 80, 815 100" />
            <animate attributeName="fill" values="#f59e0b;#10b981" dur="1.8s" repeatCount="indefinite" begin={`${delay}s`} />
          </circle>
        ))}

        {/* Node 1: Contract Event — icon top, text centered below */}
        <g className="node node-1">
          <g className="pulse-border">
            <rect x="5" y="70" width="180" height="60" rx="10" fill="rgba(79, 70, 229, 0.05)" stroke="#4f46e5" strokeWidth="2" />
          </g>
          <path d="M 85 82 L 100 82 L 95 92 L 105 92 L 85 115 L 92 100 L 80 100 Z" fill="#4f46e5" opacity="0.15" />
          <text x="95" y="95" fill="currentColor" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif" textAnchor="middle">
            Contract Event
          </text>
          <text x="95" y="113" fill="currentColor" opacity="0.5" fontSize="10" fontFamily="system-ui, sans-serif" textAnchor="middle">
            Transfer · Swap · Custom
          </text>
        </g>

        {/* Node 2: Reactivity Precompile */}
        <g className="node node-2">
          <rect x="215" y="70" width="170" height="60" rx="10" fill="rgba(124, 58, 237, 0.05)" stroke="#7c3aed" strokeWidth="2" />
          <polygon points="290,78 300,73 310,78 310,93 300,98 290,93" fill="none" stroke="#7c3aed" strokeWidth="1.2" opacity="0.15" />
          <text x="300" y="95" fill="currentColor" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif" textAnchor="middle">
            0x0100
          </text>
          <text x="300" y="113" fill="currentColor" opacity="0.5" fontSize="10" fontFamily="system-ui, sans-serif" textAnchor="middle">
            Reactive Precompile
          </text>
        </g>

        {/* Node 3: ReactiveFlow Contract */}
        <g className="node node-3">
          <rect x="415" y="70" width="170" height="60" rx="10" fill="rgba(59, 130, 246, 0.05)" stroke="#3b82f6" strokeWidth="2" />
          <rect x="487" y="78" width="16" height="20" rx="2" fill="none" stroke="#3b82f6" strokeWidth="1.2" opacity="0.15" />
          <text x="500" y="95" fill="currentColor" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif" textAnchor="middle">
            ReactiveFlow
          </text>
          <text x="500" y="113" fill="currentColor" opacity="0.5" fontSize="10" fontFamily="system-ui, sans-serif" textAnchor="middle">
            {"_onEvent() called"}
          </text>
        </g>

        {/* Node 4: Condition Check */}
        <g className="node node-4">
          <rect x="615" y="70" width="170" height="60" rx="10" fill="rgba(245, 158, 11, 0.05)" stroke="#f59e0b" strokeWidth="2" />
          <path d="M 690 78 L 710 78 L 703 88 L 703 97 L 697 97 L 697 88 Z" fill="none" stroke="#f59e0b" strokeWidth="1.2" opacity="0.15" />
          <text x="700" y="95" fill="currentColor" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif" textAnchor="middle">
            IF Condition
          </text>
          <text x="700" y="113" fill="currentColor" opacity="0.5" fontSize="10" fontFamily="system-ui, sans-serif" textAnchor="middle">
            {"amount ≥ threshold"}
          </text>
        </g>

        {/* Node 5: Action Executes */}
        <g className="node node-5">
          <rect x="815" y="70" width="170" height="60" rx="10" fill="rgba(16, 185, 129, 0.05)" stroke="#10b981" strokeWidth="2" />
          <circle cx="900" cy="83" r="8" fill="none" stroke="#10b981" strokeWidth="1.2" opacity="0.15" />
          <text x="900" y="95" fill="currentColor" fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif" textAnchor="middle">
            THEN Action
          </text>
          <text x="900" y="113" fill="currentColor" opacity="0.5" fontSize="10" fontFamily="system-ui, sans-serif" textAnchor="middle">
            Transfer · Alert · Call
          </text>
        </g>
      </svg>
    </div>
  )
}
