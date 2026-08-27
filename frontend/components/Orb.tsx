export type OrbState = "idle" | "search" | "summarize" | "verify" | "synthesize";

const SPEED: Record<OrbState, number> = {
  idle: 22,
  search: 6,
  summarize: 6,
  verify: 5,
  synthesize: 5,
};

export function Orb({ state = "idle", size = 220 }: { state?: OrbState; size?: number }) {
  const activeColor = state === "idle" ? null : `var(--agent-${state})`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full opacity-80"
        style={{
          background:
            "conic-gradient(from 0deg, var(--agent-search), var(--agent-summarize), var(--agent-verify), var(--agent-synthesize), var(--agent-search))",
          filter: `blur(${size * 0.14}px)`,
          animation: `orb-spin-slow ${SPEED[state]}s linear infinite`,
        }}
      />
      <div
        className="absolute rounded-full transition-[background] duration-700"
        style={{
          inset: "10%",
          background: activeColor
            ? `radial-gradient(circle at 35% 28%, ${activeColor}, transparent 72%)`
            : "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.55), transparent 72%)",
          filter: `blur(${size * 0.05}px)`,
          animation: "orb-breathe 3.2s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full border border-white/10 bg-[#0a0a0d]/60 backdrop-blur-sm"
        style={{ inset: "21%" }}
      />
    </div>
  );
}
