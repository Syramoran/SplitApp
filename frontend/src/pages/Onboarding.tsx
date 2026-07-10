import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ic } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { pastel } from '../lib/format';

const USE_CASES = [
  { value: 'solo', icon: 'leaf', title: 'Para mí', subtitle: 'Mis gastos del mes', color: 'mint', sub: '#4a5a4d' },
  { value: 'depto', icon: 'home', title: 'Roommates', subtitle: 'Alquiler, súper y más', color: 'lime', sub: '#55603a' },
  { value: 'pareja', icon: 'heart', title: 'En pareja', subtitle: 'La vida en común', color: 'peach', sub: '#7a5a4d' },
  { value: 'viaje', icon: 'plane', title: 'De viaje', subtitle: 'Multi-moneda, offline', color: 'blue', sub: '#48587a' },
];

export function Onboarding() {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [useCase, setUseCase] = useState('depto');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError('');
    setSaving(true);
    try {
      await register({ name, email, password, useCase });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear tu cuenta');
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center px-5">
        {step === 1 && (
          <>
            <span className="tag sticker pastel self-start" style={pastel('lilac')}>
              ✦ it's easy
            </span>
            <h1 className="h1 mt-3.5" style={{ fontSize: 42 }}>
              La plata en orden.
              <br />
              La amistad,
              <br />
              <span
                className="pastel inline-block"
                style={{ ...pastel('lime'), padding: '0 10px', borderRadius: 12, transform: 'rotate(-1.5deg)' }}
              >
                intacta ✳
              </span>
            </h1>
            <p className="mt-4 text-[14.5px] font-semibold leading-relaxed text-gray2">
              Tus gastos personales y los compartidos en un solo lugar. Nosotros dividimos,
              balanceamos y recordamos.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              <span className="tag sticker pastel" style={pastel('butter')}>
                <Ic name="home" /> Roommates
              </span>
              <span className="tag sticker-r pastel" style={pastel('peach')}>
                <Ic name="heart" /> Parejas
              </span>
              <span className="tag sticker pastel" style={pastel('blue')}>
                <Ic name="plane" /> Viajes
              </span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <span className="tag self-start">Paso 2 de 3</span>
            <h1 className="h1 mt-2.5">
              ¿Cómo la vas
              <br />a usar?
            </h1>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {USE_CASES.map((option) => (
                <button
                  key={option.value}
                  className="card pastel text-left"
                  style={{
                    ...pastel(option.color),
                    boxShadow: useCase === option.value ? '0 0 0 2.5px var(--ink)' : 'none',
                  }}
                  onClick={() => setUseCase(option.value)}
                >
                  <span className="text-[26px]">
                    <Ic name={option.icon} />
                  </span>
                  <p className="mt-2.5 text-[15px] font-extrabold">{option.title}</p>
                  <p className="text-[11.5px] font-semibold" style={{ color: option.sub }}>
                    {option.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <span className="tag self-start">Paso 3 de 3</span>
            <h1 className="h1 mt-2.5">
              ¿Cómo te
              <br />
              llamamos?
            </h1>
            <input
              className="field mt-6 text-[34px]"
              placeholder="Tu nombre"
              value={name}
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className="field mt-2.5 text-base"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="field mt-2.5 text-base"
              type="password"
              placeholder="Contraseña (mín. 8)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && <p className="mt-3 text-[12.5px] font-bold text-red-500">{error}</p>}
            <div className="mt-4 flex items-center gap-2.5">
              <span className="text-xl">✦</span>
              <p className="text-[12.5px] font-semibold text-gray2">
                Solo tu nombre. Tus amigos <b>no necesitan cuenta</b> para compartir gastos con vos.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="px-5 pb-8">
        <div className="dots mb-5">
          {[1, 2, 3].map((dot) => (
            <i key={dot} className={dot === step ? 'on' : ''} />
          ))}
        </div>
        {step < 3 ? (
          <button className="btn btn-ink" onClick={() => setStep(step + 1)}>
            {step === 1 ? 'Empezar →' : 'Continuar →'}
          </button>
        ) : (
          <button
            className="btn btn-ink"
            disabled={name.length < 2 || !email.includes('@') || password.length < 8 || saving}
            onClick={submit}
          >
            {saving ? 'Creando tu cuenta…' : 'Listo, entrar ✳'}
          </button>
        )}
        <Link to="/login" className="btn block pt-3 font-bold text-gray1">
          Ya tengo cuenta
        </Link>
      </div>
    </div>
  );
}
