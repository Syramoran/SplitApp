import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { money, pastel, stampDate } from '../lib/format';

interface DoneState {
  transfers: Array<{ fromName: string; toName: string; amount: number }>;
  groupName: string;
}

/** Estampilla "A MANO ✳" — el comprobante de cierre, la firma del diseño. */
export function SettleDone() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const state = (useLocation().state as DoneState | null) ?? { transfers: [], groupName: '' };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center px-5">
        <div className="stamp" style={{ transform: 'rotate(-1.5deg)' }}>
          <p className="text-xs font-extrabold uppercase tracking-widest">{state.groupName}</p>
          <p className="mt-2 text-[52px] font-extrabold leading-none tracking-tight">A MANO ✳</p>
          <hr className="dashline" />
          {state.transfers.map((transfer, index) => (
            <div
              key={index}
              className="flex justify-between text-xs font-bold"
              style={index > 0 ? { marginTop: 6 } : undefined}
            >
              <span>
                {transfer.fromName} → {transfer.toName}
              </span>
              <span>{money(transfer.amount)} ✓</span>
            </div>
          ))}
          <hr className="dashline" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">{stampDate()}</span>
            <span className="tag sticker-r pastel text-[11px]" style={pastel('lilac')}>
              nadie debe nada ✦
            </span>
          </div>
        </div>
        <p className="mt-4 text-center text-[13px] font-semibold text-gray2">
          El grupo quedó en cero.
          <br />
          Guardá el comprobante o compartilo con el grupo.
        </p>
      </div>
      <div className="px-5 pb-8">
        <button className="btn btn-ink" onClick={() => navigate(`/groups/${id}`)}>
          Volver al grupo
        </button>
        <button
          className="btn pt-3 font-bold text-gray1"
          onClick={() => toast('Comprobante compartido ✳')}
        >
          ↗ Compartir comprobante
        </button>
      </div>
    </div>
  );
}
