import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses, useGoal, useGoals, useGroups, useMe, useSummary, useUpdateMe } from '../api/hooks';
import { BalanceDetailSheet } from '../components/BalanceSheets';
import { ExpenseRow } from '../components/ExpenseRow';
import { Ic } from '../components/icons';
import { CardSkeleton, ErrorState, RowSkeleton, Sheet, Skeleton } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { money, monthName, monthYear, pastel, shortDate } from '../lib/format';

const GROUP_TYPE_META: Record<string, { icon: string; label: string }> = {
  convivencia: { icon: 'home', label: 'Convivencia' },
  pareja: { icon: 'heart', label: 'Pareja' },
  viaje: { icon: 'plane', label: 'Viaje' },
  evento: { icon: 'burst', label: 'Evento' },
};

export function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const updateMe = useUpdateMe();

  const me = useMe();
  const summary = useSummary();
  const goals = useGoals();
  const groups = useGroups();
  const expenses = useExpenses({ limit: 3 });

  const [sheet, setSheet] = useState<'owed' | 'owe' | 'goal' | null>(null);
  const firstGoal = goals.data?.[0];
  const goalDetail = useGoal(sheet === 'goal' ? firstGoal?.id : undefined);

  const toggleTheme = () => {
    const next = toggle();
    updateMe.mutate({ theme: next });
    toast(next === 'dark' ? 'Tema oscuro ✦' : 'Tema claro ✦');
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-4 scroll-hide">
      {/* header */}
      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-2">
          <button className="avatar border-none" style={pastel(me.data?.avatarColor ?? 'lilac')} onClick={() => navigate('/profile')}>
            {(me.data?.name ?? '·').charAt(0)}
          </button>
          <span className="tag text-[11px]">{monthName()} ✦</span>
        </div>
        <div className="flex gap-2">
          <button
            className="circle-btn"
            style={{ background: 'var(--surface)', color: 'var(--ink)' }}
            onClick={toggleTheme}
            aria-label="Cambiar tema"
          >
            <Ic name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button
            className="circle-btn"
            style={{ background: 'var(--surface)', color: 'var(--ink)' }}
            onClick={() => toast('Sin novedades por ahora ✳')}
            aria-label="Notificaciones"
          >
            <Ic name="bell" />
          </button>
        </div>
      </div>

      <h1 className="h1 mt-3.5">
        Hola, {me.data?.name ?? '…'} <Ic name="hand" />
      </h1>

      {/* resumen del mes */}
      {summary.isPending ? (
        <div className="mt-3.5">
          <CardSkeleton height={180} />
        </div>
      ) : summary.isError ? (
        <div className="mt-3.5">
          <ErrorState onRetry={() => summary.refetch()} />
        </div>
      ) : (
        <div className="card pastel mt-3.5" style={pastel('lime')}>
          <p className="label">Gastaste este mes</p>
          <p className="mt-0.5 text-[42px] font-extrabold leading-tight tracking-tight">
            {money(summary.data.monthTotal)}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              className="flex-1 rounded-field p-3 text-left"
              style={{ background: 'var(--surface)', color: 'var(--ink)' }}
              onClick={() => setSheet('owed')}
            >
              <p className="text-[10.5px] font-extrabold uppercase">
                Te deben <Ic name="coin" />
              </p>
              <p className="text-[21px] font-extrabold">{money(summary.data.owedToMe.total)}</p>
            </button>
            <button
              className="flex-1 rounded-field p-3 text-left"
              style={{ background: 'var(--surface)', color: 'var(--ink)' }}
              onClick={() => setSheet('owe')}
            >
              <p className="text-[10.5px] font-extrabold uppercase">Te toca poner</p>
              <p className="text-[21px] font-extrabold">{money(summary.data.iOwe.total)}</p>
            </button>
          </div>
          <p className="mt-2.5 text-[11px] font-bold opacity-65">
            Tocá un número para ver de dónde sale ↓
          </p>
        </div>
      )}

      {/* meta de ahorro */}
      {goals.isPending ? (
        <div className="mt-2.5">
          <CardSkeleton height={110} />
        </div>
      ) : firstGoal ? (
        <button className="card pastel mt-2.5 w-full text-left" style={pastel('mint')} onClick={() => setSheet('goal')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="label">
                <Ic name="target" /> Tu meta
              </p>
              <p className="mt-0.5 text-lg font-extrabold">{firstGoal.name}</p>
            </div>
            <span className="tag">{firstGoal.percent}%</span>
          </div>
          <div className="bar mt-3" style={{ background: 'rgba(255,255,255,.75)' }}>
            <i style={{ width: `${firstGoal.percent}%`, background: 'var(--olive)' }} />
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold">
            <p>
              {money(firstGoal.saved)} de {money(firstGoal.targetAmount)}
            </p>
            {firstGoal.targetDate && <p className="opacity-65">{monthYear(firstGoal.targetDate)}</p>}
          </div>
        </button>
      ) : null}

      {/* grupos */}
      <div className="mb-2.5 mt-5 flex items-center justify-between">
        <h2 className="h2">Gastos</h2>
        <button className="text-[12.5px] font-extrabold underline" onClick={() => navigate('/groups')}>
          ver todos
        </button>
      </div>
      {groups.isPending ? (
        <div className="flex gap-2.5">
          <Skeleton style={{ width: 160, height: 140, borderRadius: 26 }} />
          <Skeleton style={{ width: 160, height: 140, borderRadius: 26 }} />
        </div>
      ) : groups.isError ? (
        <ErrorState onRetry={() => groups.refetch()} />
      ) : groups.data.length === 0 ? (
        <button className="card w-full text-left" style={{ background: 'var(--surface)' }} onClick={() => navigate('/groups/new')}>
          <p className="text-sm font-bold">Todavía no tenés grupos ✦</p>
          <p className="row-s mt-1">Creá uno y sumá gente solo con su nombre.</p>
          <span className="chip chip-on mt-3 inline-block">+ Crear grupo</span>
        </button>
      ) : (
        <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1.5 scroll-hide">
          {groups.data.map((group) => {
            const meta = GROUP_TYPE_META[group.type];
            const balance = group.myBalance ?? 0;
            return (
              <button
                key={group.id}
                className="card pastel min-w-[160px] flex-shrink-0 text-left"
                style={pastel(group.color)}
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                <p className="text-base font-extrabold leading-tight">{group.name}</p>
                <span className="tag mt-2.5 text-[11px]">
                  <Ic name={meta.icon} /> {group.type === 'viaje' ? `Viaje · ${group.currency}` : meta.label}
                </span>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[13px] font-extrabold">
                    {Math.abs(balance) < 0.01
                      ? '✳ a mano'
                      : balance > 0
                        ? `+ ${money(balance)}`
                        : `− ${money(-balance)}`}
                  </p>
                  <span className="circle-btn" style={{ width: 34, height: 34 }}>
                    →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* últimos movimientos */}
      <h2 className="h2 mb-1 mt-4">Últimos movimientos</h2>
      {expenses.isPending ? (
        <>
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </>
      ) : expenses.isError ? (
        <ErrorState onRetry={() => expenses.refetch()} />
      ) : expenses.data.length === 0 ? (
        <p className="row-s py-3">
          Nada por acá todavía — cargá tu primer gasto con el botón <b>+</b> ✳
        </p>
      ) : (
        expenses.data.map((expense) => (
          <ExpenseRow key={expense.id} expense={expense} myUserId={me.data?.id} />
        ))
      )}
      <div style={{ height: 20 }} />

      {/* sheets */}
      <BalanceDetailSheet
        open={sheet === 'owed'}
        onClose={() => setSheet(null)}
        direction="owed"
        total={summary.data?.owedToMe.total ?? 0}
        items={summary.data?.owedToMe.items ?? []}
      />
      <BalanceDetailSheet
        open={sheet === 'owe'}
        onClose={() => setSheet(null)}
        direction="owe"
        total={summary.data?.iOwe.total ?? 0}
        items={summary.data?.iOwe.items ?? []}
      />
      <Sheet open={sheet === 'goal'} onClose={() => setSheet(null)}>
        <span className="tag sticker pastel" style={pastel('mint')}>
          <Ic name="target" /> tu meta
        </span>
        <p className="mb-0.5 mt-2.5 text-[28px] font-extrabold">{firstGoal?.name}</p>
        <p className="text-[13px] font-bold text-gray1">
          Objetivo {money(firstGoal?.targetAmount ?? 0)}
          {firstGoal?.targetDate ? ` · ${monthYear(firstGoal.targetDate)}` : ''}
        </p>
        {goalDetail.isPending ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : (
          goalDetail.data?.contributions.map((contribution) => (
            <div className="row" key={contribution.id}>
              <div>
                <p className="row-t">{contribution.label ?? 'Aporte'}</p>
                <p className="row-s">{shortDate(contribution.date)}</p>
              </div>
              <p className="amt">{money(contribution.amount)}</p>
            </div>
          ))
        )}
        <p className="mt-3 text-[11px] font-bold text-gray1">
          ✦ Registramos, no guardamos: la plata vive donde vos elijas.
        </p>
      </Sheet>
    </div>
  );
}
