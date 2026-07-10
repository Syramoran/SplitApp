import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateGroup } from '../api/hooks';
import type { GroupType, SplitType } from '../api/types';
import { Ic } from '../components/icons';
import { useToast } from '../context/ToastContext';
import { pastel } from '../lib/format';

const TYPES: Array<{ value: GroupType; icon: string; label: string; sticker: 'sticker' | 'sticker-r' }> = [
  { value: 'convivencia', icon: 'home', label: 'Convivencia', sticker: 'sticker' },
  { value: 'pareja', icon: 'heart', label: 'Pareja', sticker: 'sticker-r' },
  { value: 'viaje', icon: 'plane', label: 'Viaje', sticker: 'sticker' },
  { value: 'evento', icon: 'burst', label: 'Evento', sticker: 'sticker-r' },
];

const CURRENCIES = ['ARS', 'USD', 'EUR', 'BRL'];

export function NewGroup() {
  const navigate = useNavigate();
  const toast = useToast();
  const createGroup = useCreateGroup();

  const [name, setName] = useState('');
  const [type, setType] = useState<GroupType>('convivencia');
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [adding, setAdding] = useState(false);
  const [myPercent, setMyPercent] = useState(60);
  const [currency, setCurrency] = useState('ARS');
  const [defaultSplit, setDefaultSplit] = useState<SplitType>('equal');

  const addMember = () => {
    const trimmed = newMember.trim();
    if (trimmed) setMembers((current) => [...current, trimmed]);
    setNewMember('');
    setAdding(false);
  };

  const submit = async () => {
    try {
      await createGroup.mutateAsync({
        name: name.trim(),
        type,
        members,
        currency: type === 'viaje' ? currency : undefined,
        myPercent: type === 'pareja' ? myPercent : undefined,
        defaultSplitType: type === 'pareja' ? 'percent' : defaultSplit,
      });
      toast('Grupo creado ✳');
      navigate('/groups');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'No pudimos crear el grupo ✕');
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-3.5">
        <button className="back" onClick={() => navigate('/groups')}>
          ← Gastos
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 scroll-hide">
        <span className="tag sticker pastel mt-2 inline-block" style={pastel('blue')}>
          ✦ nuevo grupo
        </span>
        <h1 className="h1 mt-2.5">Armá tu grupo</h1>

        <label className="label mt-4 block" htmlFor="group-name">
          Nombre
        </label>
        <input
          id="group-name"
          className="field mt-2 text-xl"
          placeholder="Ej: Depto, Viaje a Salta…"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <p className="label mb-2 mt-4">Tipo</p>
        <div className="flex flex-wrap gap-[7px]">
          {TYPES.map((option) => (
            <button
              key={option.value}
              className={`chip ${option.sticker} ${type === option.value ? 'chip-on' : ''}`}
              onClick={() => setType(option.value)}
            >
              <Ic name={option.icon} /> {option.label}
            </button>
          ))}
        </div>

        <p className="label mb-2 mt-4">Personas</p>
        <div className="flex flex-wrap items-center gap-[7px]">
          <span className="chip chip-on">Vos</span>
          {members.map((member, index) => (
            <button
              key={index}
              className="chip"
              onClick={() => setMembers((current) => current.filter((_, i) => i !== index))}
            >
              {member} ✕
            </button>
          ))}
          {adding ? (
            <input
              className="chip w-32"
              style={{ borderStyle: 'dashed', borderColor: 'var(--ink)' }}
              placeholder="Nombre…"
              value={newMember}
              autoFocus
              onChange={(event) => setNewMember(event.target.value)}
              onBlur={addMember}
              onKeyDown={(event) => event.key === 'Enter' && addMember()}
            />
          ) : (
            <button
              className="chip"
              style={{ borderStyle: 'dashed', borderColor: 'var(--ink)' }}
              onClick={() => setAdding(true)}
            >
              + por nombre
            </button>
          )}
        </div>
        <div className="card pastel mt-2.5 flex items-center gap-2.5 px-4 py-3" style={pastel('mint')}>
          <span className="text-xl">✦</span>
          <p className="text-xs font-bold">
            Nadie necesita registrarse. Si quieren ver las cuentas, después les mandás un link.
          </p>
        </div>

        {type === 'pareja' && (
          <div className="card pastel mt-3" style={pastel('peach')}>
            <p className="label">
              División por defecto <Ic name="heart" />
            </p>
            <p className="mb-2 mt-2.5 text-sm font-bold">
              Proporcional a ingresos:{' '}
              <b>
                {myPercent}% vos · {100 - myPercent}% {members[0] ?? 'tu pareja'}
              </b>
            </p>
            <input
              type="range"
              min={50}
              max={80}
              value={myPercent}
              onChange={(event) => setMyPercent(Number(event.target.value))}
              aria-label="Porcentaje de división"
            />
            <p className="mt-2 text-[11px] font-bold opacity-70">
              Se aplica a cada gasto nuevo. Siempre podés ajustarlo gasto por gasto.
            </p>
          </div>
        )}

        {type === 'viaje' && (
          <div className="card pastel mt-3" style={pastel('blue')}>
            <p className="label">
              Moneda principal <Ic name="plane" />
            </p>
            <div className="mt-2.5 flex gap-1.5">
              {CURRENCIES.map((option) => (
                <button
                  key={option}
                  className={`chip ${currency === option ? 'chip-on' : ''}`}
                  onClick={() => setCurrency(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] font-bold opacity-70">
              Cargá en cualquier moneda: convertimos al tipo de cambio del día. Funciona sin señal y
              sincroniza después.
            </p>
          </div>
        )}

        {type !== 'pareja' && type !== 'viaje' && (
          <div className="card mt-3" style={{ background: 'var(--surface)' }}>
            <p className="label">División por defecto</p>
            <div className="mt-2.5 flex gap-1.5">
              {(
                [
                  ['equal', '= Iguales'],
                  ['shares', 'Partes'],
                  ['percent', '%'],
                ] as Array<[SplitType, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  className={`chip ${defaultSplit === value ? 'chip-on' : ''}`}
                  onClick={() => setDefaultSplit(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>

      <div className="px-5 pb-7">
        <button
          className="btn btn-ink"
          disabled={name.trim().length < 2 || createGroup.isPending}
          onClick={submit}
        >
          {createGroup.isPending ? 'Creando…' : 'Crear grupo ✳'}
        </button>
      </div>
    </div>
  );
}
