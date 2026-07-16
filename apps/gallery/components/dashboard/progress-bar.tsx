/** 旧 UI progressBar() の移植。parts の n を比率で横帯に積む。 */
export function ProgressBar({ parts }: { parts: Array<{ n: number; color: string }> }) {
  const total = parts.reduce((s, p) => s + p.n, 0) || 1;
  return (
    <div className="my-1.5 flex h-2 overflow-hidden rounded bg-console-bg">
      {parts.map((p, i) => (
        <span key={i} style={{ width: `${(p.n / total) * 100}%`, background: p.color }} className="block h-full" />
      ))}
    </div>
  );
}
