import { pastel } from '../lib/format';

export function Avatar({
  name,
  color,
  size = 34,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="avatar"
      style={{ ...pastel(color), width: size, height: size, fontSize: size * 0.37 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function AvatarStack({
  members,
  max = 3,
}: {
  members: Array<{ displayName: string; avatarColor: string }>;
  max?: number;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex">
      {shown.map((member, index) => (
        <span key={index} style={index > 0 ? { marginLeft: -10 } : undefined}>
          <Avatar name={member.displayName} color={member.avatarColor} />
        </span>
      ))}
      {extra > 0 && (
        <span style={{ marginLeft: -10 }}>
          <Avatar name={`+${extra}`} color="butter" />
        </span>
      )}
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="sheet-wrap"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet">
        <div className="handle" />
        {children}
      </div>
    </div>
  );
}

/** Bloques grises animados mientras cargan los datos. */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function CardSkeleton({ height = 120 }: { height?: number }) {
  return <Skeleton className="w-full" style={{ height, borderRadius: 26 }} />;
}

export function RowSkeleton() {
  return (
    <div className="row">
      <div className="flex items-center gap-3">
        <Skeleton style={{ width: 38, height: 38, borderRadius: 14 }} />
        <div className="flex flex-col gap-1.5">
          <Skeleton style={{ width: 120, height: 13 }} />
          <Skeleton style={{ width: 80, height: 10 }} />
        </div>
      </div>
      <Skeleton style={{ width: 64, height: 14 }} />
    </div>
  );
}

/** Estado de error consistente con botón de reintento. */
export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="card text-center" style={{ background: 'var(--surface)' }}>
      <p className="text-sm font-bold">Algo salió mal ✕</p>
      <p className="row-s mt-1">{message ?? 'No pudimos cargar los datos'}</p>
      <button className="chip chip-on mt-3" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}
