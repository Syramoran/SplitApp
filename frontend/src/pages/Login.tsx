import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { pastel } from '../lib/format';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center px-5 pb-8">
      <span className="tag sticker pastel self-start" style={pastel('lime')}>
        ✳ hola de nuevo
      </span>
      <h1 className="h1 mt-3.5">Entrá a tu cuenta</h1>
      <form onSubmit={submit}>
        <input
          className="field mt-6 text-base"
          type="email"
          placeholder="Email"
          value={email}
          autoFocus
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="field mt-2.5 text-base"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p className="mt-3 text-[12.5px] font-bold text-red-500">{error}</p>}
        <button
          type="submit"
          className="btn btn-ink mt-5"
          disabled={!email || !password || loading}
        >
          {loading ? 'Entrando…' : 'Entrar →'}
        </button>
      </form>
      <Link to="/onboarding" className="btn block pt-3 text-center font-bold text-gray1">
        Crear una cuenta nueva
      </Link>
    </div>
  );
}
