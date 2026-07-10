import { useMonthly } from '../api/hooks';
import { Ic } from '../components/icons';
import { CardSkeleton, ErrorState } from '../components/ui';
import { money, monthName, monthYear, pastel } from '../lib/format';

export function Insights() {
  const monthly = useMonthly();

  if (monthly.isPending) {
    return (
      <div className="flex-1 overflow-y-auto px-5 pb-4 scroll-hide">
        <h1 className="h1 mt-10">
          Tu mes,
          <br />
          en claro
        </h1>
        <div className="mt-4 flex flex-col gap-2.5">
          <CardSkeleton height={220} />
          <CardSkeleton height={120} />
          <CardSkeleton height={100} />
        </div>
      </div>
    );
  }

  if (monthly.isError) {
    return (
      <div className="flex-1 px-5 pt-10">
        <ErrorState onRetry={() => monthly.refetch()} />
      </div>
    );
  }

  const data = monthly.data;
  const maxCategory = data.categories[0]?.total ?? 1;
  const fixedPct = data.monthTotal > 0 ? Math.round((data.fixedTotal / data.monthTotal) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-4 scroll-hide">
      <div className="pt-3.5">
        <span className="tag sticker pastel" style={pastel('mint')}>
          ✦ {monthName(data.month)}
        </span>
      </div>
      <h1 className="h1 mt-2.5">
        Tu mes,
        <br />
        en claro
      </h1>

      {/* por categoría */}
      <div className="card mt-4" style={{ background: 'var(--surface)' }}>
        <p className="label mb-3.5">Por categoría</p>
        {data.categories.length === 0 ? (
          <p className="row-s">Sin gastos este mes — el gráfico se arma solo cuando cargues ✳</p>
        ) : (
          data.categories.map((category, index) => (
            <div className="mb-3.5 last:mb-0.5" key={category.name}>
              <div className="mb-1.5 flex justify-between text-[13px] font-bold">
                <span>
                  <Ic name={category.icon} /> {category.name}
                </span>
                <span>{money(category.total)}</span>
              </div>
              <div className="bar">
                <i
                  className="pastel"
                  style={{
                    width: `${Math.max(4, Math.round((category.total / maxCategory) * (index === 0 ? 88 : 88)))}%`,
                    background: `var(--${category.color})`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ahorro */}
      {data.goals.length > 0 && (
        <>
          <h2 className="h2 mb-2.5 mt-4">Ahorro</h2>
          <div className="card" style={{ background: 'var(--surface)' }}>
            {data.goals.map((goal) => (
              <div className="mb-3.5 last:mb-0.5" key={goal.id}>
                <div className="mb-1.5 flex justify-between text-[13px] font-bold">
                  <span>
                    <Ic name={goal.icon} /> {goal.name}
                    {goal.targetDate ? ` · ${monthYear(goal.targetDate)}` : ''}
                  </span>
                  <span>{money(goal.saved)}</span>
                </div>
                <div className="bar">
                  <i style={{ width: `${goal.percent}%`, background: 'var(--olive)' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2.5">
            <div className="card pastel flex-1" style={pastel('lilac')}>
              <p className="text-[11px] font-extrabold uppercase">Tasa de ahorro</p>
              <p className="mt-0.5 text-[22px] font-extrabold">{data.savings.rate}%</p>
              <span className="tag mt-2 text-[10.5px]">de lo que se movió este mes</span>
            </div>
            {data.goals[0]?.projectedDate && (
              <div className="card pastel flex-1" style={pastel('lime')}>
                <p className="text-[11px] font-extrabold uppercase">Proyección ✦</p>
                <p className="mt-1.5 text-sm font-extrabold leading-snug">
                  A este ritmo llegás a {data.goals[0].name.split(' · ')[0]} en{' '}
                  <u>{monthName(data.goals[0].projectedDate.slice(0, 7))}</u> ✳
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* fijos vs variables */}
      <div className="mt-2.5 flex gap-2.5">
        <div className="card pastel flex-1" style={pastel('lilac')}>
          <p className="text-[11px] font-extrabold uppercase">
            Fijos <Ic name="pin" />
          </p>
          <p className="mt-0.5 text-[22px] font-extrabold">{money(data.fixedTotal)}</p>
          <span className="tag mt-2 text-[10.5px]">{fixedPct}% del mes</span>
        </div>
        <div className="card pastel flex-1" style={pastel('butter')}>
          <p className="text-[11px] font-extrabold uppercase">
            Variables <Ic name="wave" />
          </p>
          <p className="mt-0.5 text-[22px] font-extrabold">{money(data.variableTotal)}</p>
          <span className="tag mt-2 text-[10.5px]">{100 - fixedPct}% del mes</span>
        </div>
      </div>

      {/* tendencia vs mes anterior */}
      {data.vsPrevMonthPct != null && (
        <div className="card pastel mt-2.5 flex items-center gap-3" style={pastel('lime')}>
          <span className="text-[26px]">
            <Ic name="trend" />
          </span>
          <p className="text-[13px] font-bold">
            {data.vsPrevMonthPct <= 0 ? (
              <>
                Vas <b>{Math.abs(data.vsPrevMonthPct)}% abajo</b> del mes pasado ✳
              </>
            ) : (
              <>
                Vas <b>{data.vsPrevMonthPct}% arriba</b> del mes pasado — ojo con los variables ✦
              </>
            )}
          </p>
        </div>
      )}
      <div style={{ height: 20 }} />
    </div>
  );
}
