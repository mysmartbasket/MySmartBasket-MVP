import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AppHeader } from '@/components/AppHeader';
import {
  getLocalSession,
  getLocalUser,
  hasOpenedAppThisTab,
  markAppOpenedThisTab,
  setLocalUser,
  startLocalSession,
} from '@/lib/session';

function AuthDialog({ mode, onDone }: { mode: 'login' | 'register'; onDone: () => void }) {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [error, setError] = useState('');

  const title = mode === 'login' ? 'Iniciar sesión' : 'Registrarse';
  const cta = mode === 'login' ? 'Iniciar sesión' : 'Registrarse';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={mode === 'login' ? 'outline' : 'outline'}
          className="w-full rounded-xl h-12 bg-white text-foreground border border-input hover:bg-muted"
        >
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {mode === 'login' ? (
            <>
              <div>
                <label className="text-sm text-muted-foreground">Usuario o teléfono</label>
                <Input
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="usuario o número de teléfono"
                  className="mt-2 h-11 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Contraseña</label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 h-11 rounded-xl"
                />
              </div>
              <Button
                className="w-full rounded-xl h-12 font-semibold"
                onClick={() => {
                  const id = loginIdentifier.trim();
                  const pwd = loginPassword.trim();
                  if (!id || !pwd) {
                    setError('Introduce usuario/teléfono y contraseña.');
                    return;
                  }
                  setError('');
                  startLocalSession(id);
                  onDone();
                }}
              >
                {cta}
              </Button>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm text-muted-foreground">Nombre</label>
                <Input
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Tu nombre"
                  className="mt-2 h-11 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Teléfono</label>
                <Input
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Ej: +34 600 000 000"
                  className="mt-2 h-11 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Usuario</label>
                <Input
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  className="mt-2 h-11 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Contraseña</label>
                <Input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 h-11 rounded-xl"
                />
              </div>
              <Button
                className="w-full rounded-xl h-12 font-semibold"
                onClick={() => {
                  const name = regName.trim();
                  const phone = regPhone.trim();
                  const username = regUsername.trim();
                  const pwd = regPassword.trim();
                  const phoneDigits = phone.replace(/\\D/g, '');

                  if (!name) {
                    setError('El nombre es obligatorio.');
                    return;
                  }
                  if (/\\d/.test(name)) {
                    setError('El nombre no puede contener números.');
                    return;
                  }
                  if (!phoneDigits || phoneDigits.length < 7) {
                    setError('Introduce un teléfono válido.');
                    return;
                  }
                  if (!username) {
                    setError('El usuario es obligatorio.');
                    return;
                  }
                  if (pwd.length < 8) {
                    setError('La contraseña debe tener al menos 8 caracteres.');
                    return;
                  }

                  setError('');
                  setLocalUser({ name, createdAt: Date.now() });
                  startLocalSession(name);
                  onDone();
                }}
              >
                {cta}
              </Button>
            </>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Welcome() {
  const navigate = useNavigate();

  const session = useMemo(() => getLocalSession(), []);
  const user = useMemo(() => getLocalUser(), []);

  // Si la app ya estaba abierta en esta pestaña y hay sesión válida, saltamos la pantalla.
  useEffect(() => {
    if (hasOpenedAppThisTab() && session) {
      navigate('/inicio', { replace: true });
      return;
    }
    // Marcamos como "abierta" en la pestaña para que en navegaciones internas no vuelva a aparecer.
    markAppOpenedThisTab();
  }, [navigate, session]);

  const isLoggedIn = Boolean(session);

  const greeting = isLoggedIn
    ? `Bienvenido de vuelta, ${session!.name}`
    : user
      ? 'Bienvenido de vuelta'
      : 'Bienvenido';

  const start = () => navigate('/inicio');

  // Swipe up = empezar (solo si hay sesión)
  const startY = useRef<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  return (
    <div
      className="h-screen bg-background flex flex-col overflow-hidden"
      onTouchStart={(e) => {
        if (!isLoggedIn) return;
        startY.current = e.touches[0]?.clientY ?? null;
        setIsSwiping(true);
      }}
      onTouchEnd={(e) => {
        if (!isLoggedIn || !isSwiping) return;
        const endY = e.changedTouches[0]?.clientY ?? null;
        const sy = startY.current;
        startY.current = null;
        setIsSwiping(false);
        if (sy == null || endY == null) return;
        const delta = sy - endY;
        if (delta > 80) start();
      }}
    >
      <AppHeader />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <section className="flex-1 min-h-0 w-full px-0 pb-0 text-center flex overflow-hidden">
          <div className="flex-1 w-full bg-black text-white px-4 sm:px-8 py-4 sm:py-8 flex flex-col items-center justify-center shadow-card rounded-none">
            <div className="w-20 h-20 sm:w-40 sm:h-40 rounded-[20px] bg-black flex items-center justify-center">
              <img
                src="/MySmartBasketLogoBig.png"
                alt="MySmartBasket logo"
                className="w-16 h-16 sm:w-32 sm:h-32 object-contain"
              />
            </div>
            <h1 className="mt-4 text-lg sm:text-3xl font-bold text-white">{greeting}</h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-200 max-w-sm">
              Tu lista inteligente para comprar mejor
            </p>

            {isLoggedIn && (
              <p className="mt-3 text-xs text-gray-300">
                Consejo: desliza hacia arriba para empezar.
              </p>
            )}
          </div>
        </section>

        <section className="w-full px-0 mt-auto flex-none">
          <div className="w-full bg-black shadow-card p-3 sm:p-5 space-y-3 rounded-none flex flex-col items-center">
            {!isLoggedIn ? (
              <>
                <AuthDialog mode="login" onDone={start} />
                <AuthDialog mode="register" onDone={start} />
                <Button
                  className="w-full rounded-xl h-12 bg-white text-foreground border border-input hover:bg-muted"
                  onClick={start}
                  variant="outline"
                >
                  Modo Demo
                </Button>
              </>
            ) : (
              <Button
                className="w-[82%] sm:w-[70%] rounded-xl h-11 bg-white text-black font-semibold border border-input hover:bg-muted"
                onClick={start}
                variant="outline"
              >
                Empezar
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
