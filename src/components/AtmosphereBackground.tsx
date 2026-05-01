export function AtmosphereBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      <div className="absolute left-[8%] top-[18%] h-64 w-64 rounded-full bg-campus-300/[0.055] blur-3xl" />
      <div className="absolute right-[8%] top-[10%] h-72 w-72 rounded-full bg-amberSoft/[0.045] blur-3xl" />
      <div className="absolute bottom-[4%] left-[42%] h-80 w-80 rounded-full bg-white/[0.03] blur-3xl" />
    </div>
  );
}
