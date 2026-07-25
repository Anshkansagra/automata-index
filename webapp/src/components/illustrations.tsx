// Original, hand-coded SVG line-art — no stock photos or third-party assets,
// so there's no licensing/watermark risk. Themed to match each research topic.

export function RoboticsArm() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.6">
        <circle cx="80" cy="240" r="18" />
        <line x1="80" y1="222" x2="150" y2="140" />
        <circle cx="150" cy="140" r="10" />
        <line x1="150" y1="140" x2="230" y2="170" />
        <circle cx="230" cy="170" r="10" />
        <line x1="230" y1="170" x2="290" y2="90" />
        <circle cx="290" cy="90" r="8" />
        <line x1="290" y1="90" x2="330" y2="60" />
        <path d="M330 60 L350 50 M330 60 L350 70" />
      </g>
      {[...Array(6)].map((_, i) => (
        <circle key={i} cx={40 + i * 65} cy={260} r="1.5" fill="currentColor" opacity="0.4" />
      ))}
    </svg>
  );
}

// A closer, gripper-focused variant — distinct silhouette from RoboticsArm.
export function RoboticGripper() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.6">
        <rect x="170" y="40" width="60" height="70" rx="8" />
        <line x1="200" y1="110" x2="200" y2="150" />
        <path d="M200 150 L150 210 M150 210 L130 250" />
        <path d="M200 150 L250 210 M250 210 L270 250" />
        <path d="M200 150 L200 220 L200 260" />
        <circle cx="130" cy="250" r="6" />
        <circle cx="270" cy="250" r="6" />
        <circle cx="200" cy="260" r="6" />
      </g>
      <g fill="currentColor" opacity="0.4">
        <circle cx="200" cy="75" r="3" />
      </g>
      <path
        d="M120 260 Q200 280 280 260"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 5"
        opacity="0.4"
      />
    </svg>
  );
}

export function NeuralNetwork() {
  const layers = [3, 5, 5, 2];
  const layerX = [60, 160, 260, 340];
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
      <g stroke="currentColor" strokeWidth="0.5" opacity="0.3">
        {layers.slice(0, -1).map((count, li) =>
          Array.from({ length: count }).map((_, ni) =>
            Array.from({ length: layers[li + 1] }).map((_, nj) => {
              const y1 = 150 - ((count - 1) * 40) / 2 + ni * 40;
              const y2 = 150 - ((layers[li + 1] - 1) * 40) / 2 + nj * 40;
              return (
                <line key={`${li}-${ni}-${nj}`} x1={layerX[li]} y1={y1} x2={layerX[li + 1]} y2={y2} />
              );
            })
          )
        )}
      </g>
      {layers.map((count, li) =>
        Array.from({ length: count }).map((_, ni) => {
          const y = 150 - ((count - 1) * 40) / 2 + ni * 40;
          return (
            <circle key={`${li}-${ni}`} cx={layerX[li]} cy={y} r="6" fill="currentColor" opacity="0.7" />
          );
        })
      )}
    </svg>
  );
}

export function AutonomousVehicle() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.6">
        <rect x="90" y="130" width="220" height="60" rx="10" />
        <circle cx="140" cy="200" r="20" />
        <circle cx="260" cy="200" r="20" />
        <path d="M60 160 Q 200 60 340 160" strokeDasharray="4 6" opacity="0.5" />
      </g>
      <g stroke="currentColor" strokeWidth="1" opacity="0.35">
        <rect x="20" y="90" width="40" height="90" />
        <rect x="340" y="70" width="40" height="90" />
        <rect x="180" y="60" width="40" height="50" />
      </g>
      <g fill="currentColor" opacity="0.5">
        <circle cx="200" cy="100" r="3" />
        <circle cx="150" cy="115" r="3" />
        <circle cx="250" cy="115" r="3" />
      </g>
    </svg>
  );
}

export function DigitalTwin() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
      <g stroke="currentColor" strokeWidth="1" opacity="0.5">
        <rect x="60" y="90" width="110" height="110" />
        <rect x="230" y="90" width="110" height="110" strokeDasharray="4 4" />
        <line x1="170" y1="145" x2="230" y2="145" strokeDasharray="2 4" />
      </g>
      <g fill="currentColor" opacity="0.6">
        <circle cx="60" cy="90" r="3" />
        <circle cx="170" cy="90" r="3" />
        <circle cx="60" cy="200" r="3" />
        <circle cx="170" cy="200" r="3" />
        <circle cx="230" cy="90" r="3" />
        <circle cx="340" cy="90" r="3" />
        <circle cx="230" cy="200" r="3" />
        <circle cx="340" cy="200" r="3" />
      </g>
    </svg>
  );
}

// Wireless communication / satellite navigation.
export function WirelessSatellite() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.6">
        <rect x="185" y="140" width="30" height="16" rx="2" />
        <line x1="200" y1="140" x2="200" y2="110" />
        <path d="M160 130 L185 148 M240 130 L215 148" />
        <rect x="140" y="110" width="26" height="14" rx="2" transform="rotate(-20 153 117)" />
        <rect x="234" y="110" width="26" height="14" rx="2" transform="rotate(20 247 117)" />
      </g>
      <g stroke="currentColor" opacity="0.4">
        <path d="M200 190 a 40 40 0 0 1 0 -60" strokeDasharray="3 5" />
        <path d="M200 210 a 60 60 0 0 1 0 -100" strokeDasharray="3 5" />
        <path d="M200 230 a 80 80 0 0 1 0 -140" strokeDasharray="3 5" />
      </g>
      <circle cx="200" cy="230" r="3" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

// Human-machine collaboration.
export function HumanMachineCollab() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.6">
        <circle cx="120" cy="100" r="22" />
        <path d="M120 122 L120 190 M90 220 L120 190 L150 220" />
        <rect x="240" y="80" width="50" height="50" rx="10" />
        <path d="M265 130 L265 190 M235 220 L265 190 L295 220" />
      </g>
      <path
        d="M150 150 Q 200 130 240 150"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <g fill="currentColor" opacity="0.6">
        <circle cx="150" cy="150" r="4" />
        <circle cx="200" cy="138" r="4" />
        <circle cx="240" cy="150" r="4" />
      </g>
    </svg>
  );
}
