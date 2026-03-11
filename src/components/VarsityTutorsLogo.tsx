"use client";

type LogoProps = {
  size?: number;
  className?: string;
  animated?: boolean;
};

export function VarsityTutorsLogo({
  size = 50,
  className = "",
  animated = true,
}: LogoProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 320 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Animated circular swoosh logo"
      >
        {/* Outer dark blue swoosh */}
        <g
          style={{
            transformOrigin: "160px 160px",
            animation: animated ? "spinSlow 6s linear infinite" : undefined,
          }}
        >
          <path
            d="M219 40
               C273 67, 300 124, 291 186
               C282 246, 241 292, 178 303
               C124 311, 78 294, 45 256
               C95 281, 152 284, 202 262
               C249 241, 279 200, 281 150
               C283 104, 261 67, 219 40Z"
            fill="#3150B8"
          />
        </g>

        {/* Inner light blue swoosh */}
        <g
          style={{
            transformOrigin: "160px 160px",
            animation: animated ? "spinReverse 4s linear infinite" : undefined,
          }}
        >
          <path
            d="M62 108
               C82 70, 120 44, 165 40
               C120 56, 87 92, 75 138
               C62 186, 73 232, 108 264
               C145 299, 200 308, 249 284
               C210 313, 162 322, 117 311
               C68 299, 31 263, 20 214
               C12 175, 26 135, 62 108Z"
            fill="#8FD7EE"
          />
        </g>

        {/* Center red circle */}
        <circle cx="160" cy="160" r="44" fill="#F76073" />

        <style>{`
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes spinReverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
        `}</style>
      </svg>
    </div>
  );
}

