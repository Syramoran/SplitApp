import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  suggestCategory,
  useCategories,
  useContribute,
  useCreateExpense,
  useGoals,
  useGroups,
  useMe,
} from '../api/hooks';
import type { SplitType } from '../api/types';
import { Ic } from '../components/icons';
import { useToast } from '../context/ToastContext';
import { money, pastel } from '../lib/format';

type Scope = 'personal' | 'group' | 'goal';

const QUICK_CATEGORIES = ['Súper', 'Comida', 'Hogar', 'Transporte', 'Salidas'];
const SPLIT_LABELS: Array<[SplitType, string]> = [
  ['equal', '= Iguales'],
  ['shares', 'Partes'],
  ['percent', '%'],
  ['exact', 'Exacto'],
];

export function AddExpense() {
  const navigate = useNavigate();
  const toast = useToast();
  const me = useMe();
  const categories = useCategories();
  const groups = useGroups();
  const goals = useGoals();
  const createExpense = useCreateExpense();
  const contribute = useContribute();

  // paso 1: monto
  const [step, setStep] = useState<'amount' | 'details'>('amount');
  const [amount, setAmount] = useState('');

  // paso 2: detalles
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [autoSuggested, setAutoSuggested] = useState(false);
  const [scope, setScope] = useState<Scope>('personal');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [paidByMemberId, setPaidByMemberId] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [goalId, setGoalId] = useState<string | null>(null);

  const total = Number(amount || 0);
  const group = groups.data?.find((g) => g.id === groupId) ?? null;
  const myMember = group?.members.find((m) => m.userId === me.data?.id) ?? null;

  // defaults al cargar datos: primer grupo, yo como pagadora, primera meta
  useEffect(() => {
    if (!groupId && groups.data && groups.data.length > 0) setGroupId(groups.data[0].id);
  }, [groups.data, groupId]);
  useEffect(() => {
    if (group && myMember && !paidByMemberId) setPaidByMemberId(myMember.id);
  }, [group, myMember, paidByMemberId]);
  useEffect(() => {
    if (!goalId && goals.data && goals.data.length > 0) setGoalId(goals.data[0].id);
  }, [goals.data, goalId]);
  useEffect(() => {
    if (group) setSplitType(group.defaultSplitType);
  }, [group]);

  // categoría sugerida sola mientras se escribe la descripción
  const suggestTimer = useRef<ReturnType<typeof setTimeout>>();
  const manualPick = useRef(false);
  useEffect(() => {
    if (manualPick.current || description.length < 3) return;
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      try {
        const { category } = await suggestCategory(description);
        if (category && !manualPick.current) {
          setCategoryId(category.id);
          setAutoSuggested(true);
        }
      } catch {
        // la sugerencia es best-effort
      }
    }, 350);
    return () => clearTimeout(suggestTimer.current);
  }, [description]);

  const keypadPress = (key: string) => {
    if (key === 'del') setAmount((current) => current.slice(0, -1));
    else if (amount.length < 8) {
      setAmount((current) => {
        const next = current + key;
        return next.replace(/^0+(?=\d)/, '');
      });
    }
  };

  const weightOf = (memberId: string, fallback: number): number => {
    const raw = weights[memberId];
    const parsed = raw === undefined || raw === '' ? fallback : Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const splitPreview = useMemo(() => {
    if (!group || total <= 0) return null;
    const count = group.members.length;
    if (splitType === 'equal') return `${money(Math.round((total / count) * 100) / 100)} c/u`;
    if (splitType === 'exact') {
      const sum = group.members.reduce((acc, m) => acc + weightOf(m.id, 0), 0);
      return `${money(sum)} de ${money(total)} asignados`;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, total, splitType, weights]);

  const buildSplits = () => {
    if (!group) return undefined;
    if (splitType === 'equal') return undefined; // el backend divide entre todos
    if (splitType === 'exact') {
      return group.members
        .map((m) => ({ memberId: m.id, amount: weightOf(m.id, 0) }))
        .filter((s) => s.amount > 0);
    }
    // partes o %
    return group.members.map((m) => ({
      memberId: m.id,
      weight: weightOf(m.id, splitType === 'percent' ? (m.splitPercent ?? 100 / group.members.length) : 1),
    }));
  };

  const save = async () => {
    const finalDescription = description.trim() || 'Gasto';
    try {
      if (scope === 'goal' && goalId) {
        await contribute.mutateAsync({ goalId, amount: total, label: 'Aporte tuyo' });
        const goalName = goals.data?.find((g) => g.id === goalId)?.name ?? 'tu meta';
        toast(`Aporte a ${goalName} guardado ✳`);
        navigate('/');
        return;
      }
      if (scope === 'group' && group) {
        await createExpense.mutateAsync({
          amount: total,
          description: finalDescription,
          categoryId: categoryId ?? undefined,
          groupId: group.id,
          paidByMemberId: paidByMemberId ?? undefined,
          splitType,
          splits: buildSplits(),
        });
        toast(`Gasto guardado ✳ dividido entre ${group.members.length}`);
        navigate(`/groups/${group.id}`);
        return;
      }
      await createExpense.mutateAsync({
        amount: total,
        description: finalDescription,
        categoryId: categoryId ?? undefined,
      });
      toast('Gasto personal guardado ✳');
      navigate('/');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'No pudimos guardar el gasto ✕');
    }
  };

  const saving = createExpense.isPending || contribute.isPending;

  // ---------- paso 1: ¿cuánto? ----------
  if (step === 'amount') {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-5 pt-3.5">
          <span className="tag sticker pastel" style={pastel('lime')}>
            ✦ nuevo gasto
          </span>
          <button className="back" onClick={() => navigate(-1)}>
            Cancelar ✕
          </button>
        </div>
        <div className="flex flex-1 flex-col justify-center text-center">
          <p className="text-sm font-bold text-gray1">¿Cuánto?</p>
          <p className="mt-1 text-[60px] font-extrabold tracking-tight">
            $ {total ? total.toLocaleString('es-AR') : '0'}
          </p>
        </div>
        <div className="keypad mb-3.5 px-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((key) => (
            <button key={key} onClick={() => keypadPress(key)}>
              {key}
            </button>
          ))}
          <button onClick={() => keypadPress('del')} aria-label="Borrar">
            ⌫
          </button>
        </div>
        <div className="px-6 pb-6">
          <button
            className="btn btn-ink"
            onClick={() => {
              if (!total) {
                toast('Poné un monto primero ✦');
                return;
              }
              setStep('details');
            }}
          >
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  // ---------- paso 2: detalles ----------
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-5 pt-3.5">
        <button className="back" onClick={() => setStep('amount')}>
          ← Monto
        </button>
        <span className="tag pastel text-[15px]" style={pastel('lime')}>
          $ {total.toLocaleString('es-AR')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 scroll-hide">
        <label className="label mt-4 block" htmlFor="description">
          ¿Qué fue?
        </label>
        <input
          id="description"
          className="field mt-2 text-[22px]"
          placeholder="Ej: súper, pizza, nafta…"
          value={description}
          autoFocus
          onChange={(event) => {
            setDescription(event.target.value);
            setAutoSuggested(false);
          }}
        />

        <p className="label mb-2 mt-4">
          Categoría{' '}
          {autoSuggested && (
            <span className="normal-case tracking-normal" style={{ color: 'var(--lime-text)' }}>
              ✦ sugerida sola
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-[7px]">
          {QUICK_CATEGORIES.map((name, index) => {
            const category = categories.data?.find((c) => c.name === name);
            if (!category) return null;
            const on = categoryId === category.id;
            return (
              <button
                key={category.id}
                className={`chip ${index % 2 ? 'sticker-r' : 'sticker'} ${on ? 'chip-on' : ''}`}
                onClick={() => {
                  manualPick.current = true;
                  setCategoryId(category.id);
                  setAutoSuggested(false);
                }}
              >
                <Ic name={category.icon} /> {category.name}
              </button>
            );
          })}
        </div>

        <p className="label mb-2 mt-4">¿De quién es?</p>
        <div className="flex flex-wrap gap-2">
          <button className={`chip ${scope === 'personal' ? 'chip-on' : ''}`} onClick={() => setScope('personal')}>
            <Ic name="leaf" /> Personal
          </button>
          {group && (
            <button className={`chip ${scope === 'group' ? 'chip-on' : ''}`} onClick={() => setScope('group')}>
              <Ic name="home" /> {group.name}
            </button>
          )}
          {goals.data && goals.data.length > 0 && (
            <button className={`chip ${scope === 'goal' ? 'chip-on' : ''}`} onClick={() => setScope('goal')}>
              <Ic name="target" /> Meta
            </button>
          )}
        </div>

        {scope === 'group' && group && (
          <>
            {groups.data && groups.data.length > 1 && (
              <>
                <p className="label mb-2 mt-4">Grupo</p>
                <div className="flex flex-wrap gap-2">
                  {groups.data.map((option) => (
                    <button
                      key={option.id}
                      className={`chip ${option.id === group.id ? 'chip-on' : ''}`}
                      onClick={() => {
                        setGroupId(option.id);
                        setPaidByMemberId(null);
                        setWeights({});
                      }}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="label mb-2 mt-4">Pagó</p>
            <div className="flex flex-wrap gap-2">
              {group.members.map((member) => (
                <button
                  key={member.id}
                  className={`chip ${paidByMemberId === member.id ? 'chip-on' : ''}`}
                  onClick={() => setPaidByMemberId(member.id)}
                >
                  {member.userId === me.data?.id ? 'Vos' : member.displayName}
                </button>
              ))}
            </div>

            <p className="label mb-2 mt-4">División</p>
            <div className="flex flex-wrap gap-[7px]">
              {SPLIT_LABELS.map(([type, label]) => (
                <button
                  key={type}
                  className={`chip ${splitType === type ? 'chip-on' : ''}`}
                  onClick={() => {
                    setSplitType(type);
                    setWeights({});
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {splitType === 'equal' ? (
              <div className="card pastel mt-3 flex items-center justify-between px-4 py-3.5" style={pastel('lilac')}>
                <p className="text-[13px] font-bold">{group.members.length} personas ÷</p>
                <p className="text-lg font-extrabold">{splitPreview}</p>
              </div>
            ) : (
              <div className="card mt-3 px-4 py-3" style={{ background: 'var(--surface)' }}>
                {group.members.map((member) => {
                  const fallback =
                    splitType === 'percent'
                      ? (member.splitPercent ?? Math.round(100 / group.members.length))
                      : splitType === 'shares'
                        ? 1
                        : 0;
                  return (
                    <div className="row" key={member.id} style={{ padding: '9px 0' }}>
                      <p className="row-t">
                        {member.userId === me.data?.id ? 'Vos' : member.displayName}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {splitType === 'exact' && <span className="text-xs font-bold">$</span>}
                        <input
                          className="field w-24 py-1.5 text-right text-sm"
                          style={{ background: 'var(--bar-bg)' }}
                          inputMode="decimal"
                          value={weights[member.id] ?? String(fallback)}
                          onChange={(event) =>
                            setWeights((current) => ({ ...current, [member.id]: event.target.value }))
                          }
                        />
                        {splitType === 'percent' && <span className="text-xs font-bold">%</span>}
                        {splitType === 'shares' && <span className="text-xs font-bold">partes</span>}
                      </div>
                    </div>
                  );
                })}
                {splitType === 'exact' && <p className="row-s pt-1">{splitPreview}</p>}
              </div>
            )}
          </>
        )}

        {scope === 'goal' && goals.data && (
          <>
            <p className="label mb-2 mt-4">¿A qué meta?</p>
            <div className="flex flex-wrap gap-2">
              {goals.data.map((goal) => (
                <button
                  key={goal.id}
                  className={`chip ${goalId === goal.id ? 'chip-on' : ''}`}
                  onClick={() => setGoalId(goal.id)}
                >
                  <Ic name={goal.icon} /> {goal.name}
                </button>
              ))}
            </div>
            <div className="card pastel mt-3 flex items-center gap-2.5 px-4 py-3" style={pastel('mint')}>
              <span className="text-lg">✦</span>
              <p className="text-xs font-bold">
                Acá solo llevamos la cuenta — la plata vive donde vos elijas (cuenta, plazo fijo,
                colchón).
              </p>
            </div>
          </>
        )}

        <button
          className="btn btn-ghost mt-4"
          onClick={() => toast('El escaneo de tickets llega en la próxima iteración ✦')}
        >
          <Ic name="camera" /> Escanear ticket
        </button>
        <div style={{ height: 20 }} />
      </div>

      <div className="px-5 pb-7">
        <button className="btn btn-ink" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar gasto ✳'}
        </button>
      </div>
    </div>
  );
}
