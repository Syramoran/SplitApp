import { useNavigate } from 'react-router-dom';
import { useGroups } from '../api/hooks';
import { Ic } from '../components/icons';
import { AvatarStack, CardSkeleton, ErrorState } from '../components/ui';
import { money, pastel } from '../lib/format';

export function Groups() {
  const navigate = useNavigate();
  const groups = useGroups();

  const balanceTag = (balance: number, type: string, currency: string) => {
    if (type === 'viaje') {
      return (
        <>
          <Ic name="plane" /> {currency}
          {Math.abs(balance) >= 0.01 &&
            ` · ${balance > 0 ? `+ ${money(balance)}` : `− ${money(-balance)}`}`}
        </>
      );
    }
    if (Math.abs(balance) < 0.01) return <>✳ a mano</>;
    if (balance > 0) return <>+ {money(balance)} a tu favor</>;
    return <>te toca poner {money(-balance)}</>;
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-4 scroll-hide">
      <div className="pt-3.5">
        <span className="tag sticker pastel" style={pastel('butter')}>
          ✦ tu gente
        </span>
      </div>
      <h1 className="h1 mt-2.5">Gastos</h1>

      {groups.isPending ? (
        <div className="mt-4 flex flex-col gap-2.5">
          <CardSkeleton height={130} />
          <CardSkeleton height={130} />
          <CardSkeleton height={130} />
        </div>
      ) : groups.isError ? (
        <div className="mt-4">
          <ErrorState onRetry={() => groups.refetch()} />
        </div>
      ) : groups.data.length === 0 ? (
        <div className="card mt-4 text-center" style={{ background: 'var(--surface)' }}>
          <p className="text-3xl">✦</p>
          <p className="mt-2 text-sm font-bold">Todavía no armaste ningún grupo</p>
          <p className="row-s mt-1">
            Depto, pareja, viaje o evento — nadie necesita registrarse para estar.
          </p>
        </div>
      ) : (
        groups.data.map((group, index) => (
          <button
            key={group.id}
            className={`card pastel w-full text-left ${index === 0 ? 'mt-4' : 'mt-2.5'}`}
            style={pastel(group.color)}
            onClick={() => navigate(`/groups/${group.id}`)}
          >
            <div className="flex items-start justify-between">
              <p className="text-xl font-extrabold">{group.name}</p>
              <span className="circle-btn" style={{ width: 36, height: 36 }}>
                →
              </span>
            </div>
            <div className="mt-3.5 flex items-center justify-between">
              <AvatarStack members={group.members} />
              <span className="tag">
                {group.type === 'pareja' && group.members[0]?.splitPercent != null ? (
                  <>
                    <Ic name="heart" /> división {group.members[0].splitPercent}/
                    {100 - group.members[0].splitPercent}
                  </>
                ) : (
                  balanceTag(group.myBalance ?? 0, group.type, group.currency)
                )}
              </span>
            </div>
          </button>
        ))
      )}

      <button className="btn btn-ghost mt-3.5" onClick={() => navigate('/groups/new')}>
        + Crear grupo
      </button>
      <div style={{ height: 20 }} />
    </div>
  );
}
