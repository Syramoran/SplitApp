import { useMe, useRecurring, useUpdateMe } from '../api/hooks';
import { Ic } from '../components/icons';
import { Avatar, CardSkeleton, ErrorState } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { pastel } from '../lib/format';

export function Profile() {
  const me = useMe();
  const recurring = useRecurring();
  const updateMe = useUpdateMe();
  const { logout } = useAuth();
  const toast = useToast();

  const toggleReminders = () => {
    if (!me.data) return;
    const next = !me.data.remindersEnabled;
    updateMe.mutate({ remindersEnabled: next });
    toast(next ? 'Recordatorios activados ✳' : 'Recordatorios en pausa ✦');
  };

  const activeRecurring = recurring.data?.filter((template) => template.active).length ?? 0;

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-4 scroll-hide">
      {me.isPending ? (
        <div className="mt-4 flex flex-col gap-3">
          <CardSkeleton height={60} />
          <CardSkeleton height={240} />
        </div>
      ) : me.isError ? (
        <div className="mt-4">
          <ErrorState onRetry={() => me.refetch()} />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 pt-3.5">
            <Avatar name={me.data.name} color={me.data.avatarColor} size={52} />
            <h1 className="h1 text-[28px]">{me.data.name}</h1>
          </div>

          <div className="card mt-4" style={{ background: 'var(--surface)' }}>
            <div className="row">
              <div>
                <p className="row-t">
                  <Ic name="clock" /> Recordatorios automáticos
                </p>
                <p className="row-s">La app recuerda por vos — nunca quedás como el que reclama</p>
              </div>
              <button
                className={`chip text-[11px] ${me.data.remindersEnabled ? 'chip-on' : ''}`}
                onClick={toggleReminders}
              >
                {me.data.remindersEnabled ? 'On' : 'Off'}
              </button>
            </div>
            <div className="row">
              <div>
                <p className="row-t">
                  <Ic name="repeat" /> Gastos recurrentes
                </p>
                <p className="row-s">Alquiler e internet se cargan solos cada mes</p>
              </div>
              <span className="chip text-[11px]" style={{ pointerEvents: 'none' }}>
                {recurring.isPending ? '…' : `${activeRecurring} activos`}
              </span>
            </div>
            <button
              className="row w-full text-left"
              onClick={() => toast('La exportación llega en la próxima iteración ✦')}
            >
              <div>
                <p className="row-t">
                  <Ic name="doc" /> Exportar resúmenes
                </p>
                <p className="row-s">PDF o planilla por grupo o por mes</p>
              </div>
              <span className="font-extrabold">→</span>
            </button>
            <div className="row">
              <div>
                <p className="row-t">
                  <Ic name="coin" /> Moneda
                </p>
                <p className="row-s">
                  {me.data.currency} · {me.data.currency === 'ARS' ? 'peso argentino' : me.data.currency}
                </p>
              </div>
              <span className="font-extrabold">→</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="tag sticker pastel" style={pastel('lime')}>
              ✳ lo core es gratis. siempre.
            </span>
          </div>

          <button className="btn mt-6 font-bold text-gray1" onClick={logout}>
            Cerrar sesión
          </button>
        </>
      )}
      <div style={{ height: 20 }} />
    </div>
  );
}
