'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Check, Lock, Users, ClipboardList, LayoutDashboard, LogOut, ChevronRight, Flame, Snowflake } from 'lucide-react';
import { useUsers, usePedidos, useEvento } from '../lib/store';

// ---------- Palette (inline styles, no arbitrary Tailwind colors) ----------
const C = {
  bg: '#FBF6EE',
  card: '#FFFFFF',
  border: '#EFE6D8',
  borderSoft: '#F1ECE3',
  text: '#2E2A26',
  textSoft: '#8A7E72',
  textFaint: '#B3A698',
  textFainter: '#C9BCAC',
  primary: '#C0512F',
  primaryDark: '#A8431F',
  primarySoft: '#FBEAE2',
  green: '#3D7A5E',
  greenSoft: '#E7F1EC',
  blue: '#4A6FA5',
  amberBg: '#FFF4E5',
  amberBorder: '#F0D9B5',
  dark: '#2E2A26',
};

const HORARIOS = ['20:30', '21:00', '21:30', 'Otro'];
const FORMAS_PAGO = ['Efectivo', 'Transferencia', 'Otro'];

const uid = () => Math.random().toString(36).slice(2, 10);

const fmtDocenas = (n) => {
  const num = Number(n);
  if (Number.isInteger(num)) return `${num}`;
  return num.toFixed(1).replace('.0', '').replace('.5', '½');
};

const fmtMoney = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

const norm = (s) => (s || '').toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const ordenarPorApellidoNombre = (lista) =>
  lista.slice().sort((a, b) => {
    const apA = norm(a.apellido), apB = norm(b.apellido);
    if (apA < apB) return -1;
    if (apA > apB) return 1;
    const noA = norm(a.nombre), noB = norm(b.nombre);
    if (noA < noB) return -1;
    if (noA > noB) return 1;
    return 0;
  });

// ---------- Root ----------
export default function App() {
  const { users, addUser, removeUser } = useUsers();
  const { pedidos, addPedido, updatePedido, deletePedido } = usePedidos();
  const { evento, updateEvento } = useEvento();

  const [session, setSession] = useState(null);

  // Restaurar sesión guardada en este teléfono (no hace falta loguearse cada vez)
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('cooperadora_session') : null;
    if (saved) {
      try { setSession(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleLogin = (s) => {
    setSession(s);
    window.localStorage.setItem('cooperadora_session', JSON.stringify(s));
  };

  const handleLogout = () => {
    setSession(null);
    window.localStorage.removeItem('cooperadora_session');
  };

  if (users === null || pedidos === null || evento === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF6EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8A7E72', fontSize: 14 }}>Cargando… 🥟</p>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  const me = users.find((u) => u.id === session.userId);

  if (!me) {
    // El usuario fue eliminado por el admin desde que se logueó
    handleLogout();
    return null;
  }

  // ---- Wrappers para mantener la misma API que el resto del código ya usa ----
  const setUsers = (updaterOrValue) => {
    // Las pantallas usan setUsers((prev) => [...prev, nuevo]) para agregar,
    // y setUsers((prev) => prev.filter(...)) para quitar. Detectamos cuál es.
    const prev = users;
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
    if (next.length > prev.length) {
      const nuevo = next.find((u) => !prev.some((p) => p.id === u.id));
      if (nuevo) {
        const { id, ...data } = nuevo;
        addUser(data);
      }
    } else if (next.length < prev.length) {
      const eliminado = prev.find((u) => !next.some((n) => n.id === u.id));
      if (eliminado) removeUser(eliminado.id);
    }
  };

  const setPedidos = (updaterOrValue) => {
    const prev = pedidos;
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;

    if (next.length > prev.length) {
      const nuevo = next.find((p) => !prev.some((x) => x.id === p.id));
      if (nuevo) {
        const { id, ...data } = nuevo;
        addPedido(data);
      }
    } else if (next.length < prev.length) {
      const eliminado = prev.find((p) => !next.some((x) => x.id === p.id));
      if (eliminado) deletePedido(eliminado.id);
    } else {
      // Mismo largo: buscamos qué registro cambió para actualizarlo
      const cambiado = next.find((p) => {
        const orig = prev.find((x) => x.id === p.id);
        return orig && JSON.stringify(orig) !== JSON.stringify(p);
      });
      if (cambiado) {
        const { id, ...changes } = cambiado;
        updatePedido(id, changes);
      }
    }
  };

  const setEvento = (updaterOrValue) => {
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(evento) : updaterOrValue;
    updateEvento(next);
  };

  return (
    <MainApp
      me={me}
      users={users}
      setUsers={setUsers}
      pedidos={pedidos}
      setPedidos={setPedidos}
      evento={evento}
      setEvento={setEvento}
      onLogout={handleLogout}
    />
  );
}

// ---------- Login ----------
function LoginScreen({ users, onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const found = users.find((u) => u.user.toLowerCase() === user.trim().toLowerCase() && u.pass === pass);
    if (!found) {
      setError('Usuario o contraseña incorrectos.');
      return;
    }
    onLogin({ userId: found.id, rol: found.rol });
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 384 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: C.primary, marginBottom: 16, boxShadow: `0 10px 25px -5px ${C.primary}33` }}>
            <span style={{ fontSize: 30 }}>🥟</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: 'Georgia, serif', margin: 0 }}>La Cooperadora</h1>
          <p style={{ color: C.textSoft, fontSize: 14, marginTop: 4 }}>Gestión de pedidos de empanadas</p>
        </div>

        <form onSubmit={submit} style={{ background: C.card, borderRadius: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Usuario</label>
            <input value={user} onChange={(e) => setUser(e.target.value)} style={inputStyle} placeholder="Tu usuario" autoCapitalize="none" />
          </div>
          <div>
            <label style={labelStyle}>Contraseña</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} style={inputStyle} placeholder="••••••" />
          </div>
          {error && <p style={{ fontSize: 14, color: C.primary, margin: 0 }}>{error}</p>}
          <button type="submit" style={{ ...btnPrimary, padding: '12px 0' }}>Ingresar</button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: C.textFaint, lineHeight: 1.6 }}>
          ¿No tenés usuario? Pedile a <span style={{ fontWeight: 600, color: C.textSoft }}>Francolino / Administrador</span> que te registre.
          <br />
          <span style={{ marginTop: 8, display: 'inline-block', color: C.textFainter }}>Demo — probá con: jperez / 1234</span>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: C.textSoft, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 15, boxSizing: 'border-box' };
const btnPrimary = { width: '100%', background: C.primary, color: '#fff', fontWeight: 600, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15 };
const btnGhost = { flex: 1, padding: '12px 0', borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, fontWeight: 600, cursor: 'pointer', fontSize: 14 };

// ---------- Main App ----------
function MainApp({ me, users, setUsers, pedidos, setPedidos, evento, setEvento, onLogout }) {
  const isAdmin = me.rol === 'admin';
  const isTesorero = evento.tesoreroId === me.id;

  const [tab, setTab] = useState('pedidos');

  const tabs = useMemo(() => {
    const base = [
      { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
      { id: 'panel', label: 'Panel', icon: LayoutDashboard },
    ];
    if (isTesorero) base.push({ id: 'tesoreria', label: 'Tesorería', icon: Check });
    if (isAdmin) base.push({ id: 'admin', label: 'Integrantes', icon: Users });
    return base;
  }, [isAdmin, isTesorero]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 96 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: 'Georgia, serif', margin: 0 }}>La Cooperadora 🥟</h1>
          <p style={{ fontSize: 12, color: C.textSoft, margin: 0 }}>
            Hola, {me.nombre} {isTesorero && <span style={{ color: C.primary, fontWeight: 600 }}>· Tesorero/a</span>}
          </p>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', color: C.textSoft, padding: 8, cursor: 'pointer' }}>
          <LogOut size={20} />
        </button>
      </header>

      <TotalsBanner pedidos={pedidos} evento={evento} />

      <main style={{ padding: '20px 20px' }}>
        {tab === 'pedidos' && <PedidosTab me={me} pedidos={pedidos} setPedidos={setPedidos} evento={evento} />}
        {tab === 'panel' && <PanelTab pedidos={pedidos} evento={evento} />}
        {tab === 'tesoreria' && isTesorero && (
          <TesoreriaTab pedidos={pedidos} setPedidos={setPedidos} evento={evento} setEvento={setEvento} users={users} />
        )}
        {tab === 'admin' && isAdmin && <AdminTab users={users} setUsers={setUsers} evento={evento} setEvento={setEvento} />}
      </main>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-around', padding: '8px 8px' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 12, background: 'none', border: 'none', cursor: 'pointer', color: active ? C.primary : C.textFaint }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ---------- Totals Banner ----------
function TotalsBanner({ pedidos, evento }) {
  const totals = useMemo(() => {
    let crudas = 0, fritas = 0;
    let pendCrudas = 0, pendFritas = 0;
    let efectivo = 0, transferencia = 0, otro = 0;

    pedidos.forEach((p) => {
      const d = Number(p.docenas);
      if (p.modalidad === 'Crudas') crudas += d; else fritas += d;
      if (!p.entregado) {
        if (p.modalidad === 'Crudas') pendCrudas += d; else pendFritas += d;
      }
      if (p.entregado && p.formaPagoCobro) {
        const monto = evento.precioDocena ? d * evento.precioDocena : 0;
        if (p.formaPagoCobro === 'Efectivo') efectivo += monto;
        else if (p.formaPagoCobro === 'Transferencia') transferencia += monto;
        else otro += monto;
      }
    });

    return { crudas, fritas, total: crudas + fritas, pendCrudas, pendFritas, efectivo, transferencia, otro };
  }, [pedidos, evento]);

  const eventoIniciado = !!evento.tesoreroId;

  return (
    <div style={{ padding: '16px 20px 0' }}>
      <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <SectionLabel>Totales generales</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 12 }}>
          <Stat label="Total docenas" value={fmtDocenas(totals.total)} accent={C.text} />
          <Stat label="Crudas" value={fmtDocenas(totals.crudas)} accent={C.green} icon={<Snowflake size={14} />} />
          <Stat label="Fritas" value={fmtDocenas(totals.fritas)} accent={C.primary} icon={<Flame size={14} />} />
        </div>

        {eventoIniciado && (
          <>
            <Divider />
            <SectionLabel>Pendientes de entrega</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginTop: 12 }}>
              <Stat label="Crudas" value={fmtDocenas(totals.pendCrudas)} accent={C.green} icon={<Snowflake size={14} />} />
              <Stat label="Fritas" value={fmtDocenas(totals.pendFritas)} accent={C.primary} icon={<Flame size={14} />} />
            </div>
          </>
        )}

        {(totals.efectivo > 0 || totals.transferencia > 0 || totals.otro > 0) && (
          <>
            <Divider />
            <SectionLabel>Recaudado</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 12 }}>
              <Stat label="Efectivo" value={fmtMoney(totals.efectivo)} accent={C.green} small />
              <Stat label="Transfer." value={fmtMoney(totals.transferencia)} accent={C.blue} small />
              <Stat label="Otro" value={fmtMoney(totals.otro)} accent={C.textSoft} small />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <p style={{ fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{children}</p>;
}
function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '12px 0' }} />;
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Buscar por apellido...'}
      style={{ ...inputStyle, marginBottom: 8 }}
    />
  );
}

function Stat({ label, value, accent, icon, small }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 700, fontSize: small ? 16 : 24, color: accent, fontFamily: 'Georgia, serif' }}>
        {icon}
        {value}
      </div>
      <div style={{ fontSize: 10, color: C.textFaint, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ---------- Pedidos Tab ----------
function PedidosTab({ me, pedidos, setPedidos, evento }) {
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const ventaCerrada = evento.estado === 'cerrado';
  const enVentasExtra = evento.estado === 'ventas_extra';

  const filtrar = (lista) => {
    const q = norm(busqueda.trim());
    if (!q) return lista;
    return lista.filter((p) => norm(p.apellido).includes(q));
  };

  const misPedidos = ordenarPorApellidoNombre(filtrar(pedidos.filter((p) => p.cargadoPor === me.id)));
  const todosPedidos = ordenarPorApellidoNombre(filtrar(pedidos));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ventaCerrada && (
        <div style={{ background: C.borderSoft, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, fontSize: 14, color: C.textSoft, textAlign: 'center' }}>
          La venta de este mes está cerrada. No se pueden cargar nuevos pedidos.
        </div>
      )}

      {enVentasExtra && (
        <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 14, padding: 12, fontSize: 14, color: C.textSoft, textAlign: 'center' }}>
          🟡 Quedan docenas extra disponibles para vender. ¡Podés cargar nuevos pedidos!
        </div>
      )}

      {!ventaCerrada && (
        <button
          onClick={() => setShowForm(true)}
          style={{ width: '100%', background: C.primary, color: '#fff', fontWeight: 600, padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
          <Plus size={20} /> Nuevo pedido
        </button>
      )}

      {showForm && (
        <PedidoForm
          me={me}
          evento={evento}
          onSave={(pedido) => {
            setPedidos((prev) => [...prev, { ...pedido, id: uid(), cargadoPor: me.id, entregado: false, formaPagoCobro: null }]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div>
        <SectionLabel>Mis pedidos cargados ({misPedidos.length})</SectionLabel>
        <div style={{ marginTop: 8 }}>
          <SearchBox value={busqueda} onChange={setBusqueda} placeholder="Buscar por apellido del comprador..." />
        </div>
        {misPedidos.length === 0 ? (
          <p style={{ fontSize: 14, color: C.textFaint, textAlign: 'center', padding: '32px 0' }}>
            {busqueda ? 'No se encontraron pedidos con ese apellido.' : 'Todavía no cargaste ningún pedido.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {misPedidos.map((p) => (
              <PedidoCard key={p.id} pedido={p} me={me} onDelete={() => setPedidos((prev) => prev.filter((x) => x.id !== p.id))} />
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionLabel>Todos los pedidos ({todosPedidos.length})</SectionLabel>
        {todosPedidos.length === 0 ? (
          <p style={{ fontSize: 14, color: C.textFaint, textAlign: 'center', padding: '32px 0' }}>
            {busqueda ? 'No se encontraron pedidos con ese apellido.' : 'Aún no hay pedidos cargados.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {todosPedidos.map((p) => (
              <PedidoCard key={p.id} pedido={p} me={me} onDelete={() => setPedidos((prev) => prev.filter((x) => x.id !== p.id))} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PedidoCard({ pedido, me, onDelete }) {
  const [confirmando, setConfirmando] = useState(false);
  const puedeEliminar = me && pedido.cargadoPor === me.id && !pedido.entregado;

  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontWeight: 600, color: C.text, fontSize: 14, margin: 0 }}>{pedido.nombre} {pedido.apellido}</p>
          <p style={{ fontSize: 12, color: C.textSoft, margin: '2px 0 0' }}>
            {fmtDocenas(pedido.docenas)} doc. · {pedido.modalidad} · {pedido.horario}
          </p>
          {pedido.observaciones && (
            <p style={{ fontSize: 12, color: C.textFaint, margin: '4px 0 0', fontStyle: 'italic' }}>"{pedido.observaciones}"</p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {pedido.entregado ? (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenSoft, padding: '4px 8px', borderRadius: 999 }}>Entregado</span>
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.primary, background: C.primarySoft, padding: '4px 8px', borderRadius: 999 }}>Pendiente</span>
          )}
          <span style={{ fontSize: 10, color: C.textFaint }}>
            {pedido.pagado === 'si'
              ? `Pagó al encargar (${pedido.formaPagoPrevista})`
              : pedido.formaPagoPrevista
                ? `Paga: ${pedido.formaPagoPrevista}`
                : 'Paga al retirar (sin especificar)'}
          </span>
        </div>
      </div>

      {puedeEliminar && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {!confirmando ? (
            <button
              onClick={() => setConfirmando(true)}
              style={{ fontSize: 12, color: C.primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Eliminar pedido
            </button>
          ) : (
            <>
              <span style={{ fontSize: 12, color: C.textSoft, alignSelf: 'center' }}>¿Eliminar este pedido?</span>
              <button onClick={() => setConfirmando(false)} style={{ fontSize: 12, color: C.textSoft, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>No</button>
              <button onClick={onDelete} style={{ fontSize: 12, color: '#fff', fontWeight: 700, background: C.primary, border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Sí, eliminar</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PedidoForm({ me, evento, onSave, onCancel }) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', docenas: 1, horario: HORARIOS[0], modalidad: 'Crudas',
    observaciones: '', pagado: 'no', formaPagoPrevista: '',
  });

  const [errorPago, setErrorPago] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const adjustDocenas = (delta) => setForm((f) => ({ ...f, docenas: Math.max(0.5, Number(f.docenas) + delta) }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim()) return;
    if (form.pagado === 'si' && !form.formaPagoPrevista) {
      setErrorPago(true);
      return;
    }
    onSave(form);
  };

  const segBtn = (active, color) => ({
    padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${active ? color : C.border}`, background: active ? color : '#fff', color: active ? '#fff' : C.textSoft,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  });

  return (
    <form onSubmit={submit} style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <p style={{ fontWeight: 700, color: C.text, fontFamily: 'Georgia, serif', margin: 0, fontSize: 16 }}>Nuevo pedido</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Nombre"><input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} style={inputStyle} placeholder="Nombre" /></Field>
        <Field label="Apellido"><input value={form.apellido} onChange={(e) => set('apellido', e.target.value)} style={inputStyle} placeholder="Apellido" /></Field>
      </div>

      <Field label="Cantidad de docenas (mín. ½)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => adjustDocenas(-0.5)} style={stepBtn}>−</button>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 20, color: C.text, fontFamily: 'Georgia, serif' }}>
            {fmtDocenas(form.docenas)} {form.docenas === 1 ? 'docena' : 'docenas'}
          </div>
          <button type="button" onClick={() => adjustDocenas(0.5)} style={stepBtn}>+</button>
        </div>
      </Field>

      <Field label="Día de retiro">
        <div style={{ padding: '12px 16px', borderRadius: 12, background: C.borderSoft, color: C.textSoft, fontSize: 14 }}>
          📅 {new Date(evento.diaRetiro + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          <span style={{ display: 'block', fontSize: 10, marginTop: 2, color: C.textFainter }}>Fijado por la comisión</span>
        </div>
      </Field>

      <Field label="Horario de retiro">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {HORARIOS.map((h) => (
            <button key={h} type="button" onClick={() => set('horario', h)} style={segBtn(form.horario === h, C.primary)}>{h}</button>
          ))}
        </div>
      </Field>

      <Field label="Modalidad de entrega">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Crudas', 'Fritas'].map((m) => (
            <button key={m} type="button" onClick={() => set('modalidad', m)} style={segBtn(form.modalidad === m, C.green)}>
              {m === 'Crudas' ? <Snowflake size={14} /> : <Flame size={14} />} {m}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Observaciones (opcional)">
        <textarea value={form.observaciones} onChange={(e) => set('observaciones', e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: 'none' }} placeholder="Aclaraciones del pedido..." />
      </Field>

      <Field label="Forma de pago">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <button type="button" onClick={() => { set('pagado', 'si'); setErrorPago(false); }} style={segBtn(form.pagado === 'si', C.dark)}>Ya pagó</button>
          <button type="button" onClick={() => { set('pagado', 'no'); setErrorPago(false); }} style={segBtn(form.pagado === 'no', C.dark)}>Paga al retirar</button>
        </div>

        <p style={{ fontSize: 11, fontWeight: 600, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
          {form.pagado === 'si' ? '¿Cómo pagó? (obligatorio)' : '¿Cómo pagará? (opcional)'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {FORMAS_PAGO.map((fp) => (
            <button
              key={fp}
              type="button"
              onClick={() => { set('formaPagoPrevista', fp); setErrorPago(false); }}
              style={{ ...segBtn(form.formaPagoPrevista === fp, C.primary), padding: '8px 0', fontSize: 12 }}
            >
              {fp}
            </button>
          ))}
        </div>
        {errorPago && (
          <p style={{ fontSize: 12, color: C.primary, marginTop: 8, marginBottom: 0 }}>
            Indicá la forma de pago: el comprador ya pagó al encargar.
          </p>
        )}
      </Field>

      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Cancelar</button>
        <button type="submit" style={{ ...btnPrimary, flex: 1, padding: '12px 0' }}>Guardar pedido</button>
      </div>
    </form>
  );
}

const stepBtn = { width: 40, height: 40, borderRadius: 12, background: '#F1ECE3', color: '#2E2A26', fontWeight: 700, fontSize: 18, border: 'none', cursor: 'pointer' };

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ---------- Panel Tab ----------
function PanelTab({ pedidos, evento }) {
  const porModalidad = useMemo(() => {
    const groups = { Crudas: [], Fritas: [] };
    pedidos.forEach((p) => groups[p.modalidad]?.push(p));
    return groups;
  }, [pedidos]);

  const resumenFinal = evento.estado === 'cerrado' || evento.estado === 'ventas_extra';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {resumenFinal && <ResumenFinal pedidos={pedidos} evento={evento} />}

      <div>
        <h2 style={h2Style}>Día de retiro</h2>
        <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: 'Georgia, serif', margin: 0, textTransform: 'capitalize' }}>
            {new Date(evento.diaRetiro + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p style={{ fontSize: 12, color: C.textFaint, marginTop: 4 }}>Definido por la comisión para este evento</p>
        </div>
      </div>

      <div>
        <h2 style={h2Style}>Pedidos por modalidad</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.green, marginBottom: 4 }}>
              <Snowflake size={16} /> <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Crudas</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: 'Georgia, serif', margin: 0 }}>{porModalidad.Crudas.length}</p>
            <p style={{ fontSize: 12, color: C.textFaint, margin: 0 }}>pedidos</p>
          </div>
          <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.primary, marginBottom: 4 }}>
              <Flame size={16} /> <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Fritas</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: 'Georgia, serif', margin: 0 }}>{porModalidad.Fritas.length}</p>
            <p style={{ fontSize: 12, color: C.textFaint, margin: 0 }}>pedidos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const h2Style = { fontWeight: 700, color: C.text, fontFamily: 'Georgia, serif', marginBottom: 8, fontSize: 16 };

function ResumenFinal({ pedidos, evento }) {
  const data = useMemo(() => {
    let crudas = 0, fritas = 0, efectivo = 0, transferencia = 0, otro = 0;
    pedidos.forEach((p) => {
      const d = Number(p.docenas);
      if (p.modalidad === 'Crudas') crudas += d; else fritas += d;
      if (p.entregado && p.formaPagoCobro && evento.precioDocena) {
        const monto = d * evento.precioDocena;
        if (p.formaPagoCobro === 'Efectivo') efectivo += monto;
        else if (p.formaPagoCobro === 'Transferencia') transferencia += monto;
        else otro += monto;
      }
    });
    return { crudas, fritas, total: crudas + fritas, efectivo, transferencia, otro, recaudado: efectivo + transferencia + otro };
  }, [pedidos, evento]);

  return (
    <div style={{ background: C.dark, borderRadius: 18, padding: 20, color: '#fff' }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textFainter, marginBottom: 12 }}>Resumen de la jornada</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <div><p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0 }}>{fmtDocenas(data.total)}</p><p style={{ fontSize: 10, color: C.textFainter, textTransform: 'uppercase', margin: 0 }}>Total docenas</p></div>
        <div><p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0 }}>{fmtDocenas(data.crudas)}</p><p style={{ fontSize: 10, color: C.textFainter, textTransform: 'uppercase', margin: 0 }}>Crudas</p></div>
        <div><p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0 }}>{fmtDocenas(data.fritas)}</p><p style={{ fontSize: 10, color: C.textFainter, textTransform: 'uppercase', margin: 0 }}>Fritas</p></div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', marginBottom: 16 }} />

      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.textFainter, marginBottom: 8 }}>Recaudado: {fmtMoney(data.recaudado)}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <div><p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{fmtMoney(data.efectivo)}</p><p style={{ fontSize: 10, color: C.textFainter, textTransform: 'uppercase', margin: 0 }}>Efectivo</p></div>
        <div><p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{fmtMoney(data.transferencia)}</p><p style={{ fontSize: 10, color: C.textFainter, textTransform: 'uppercase', margin: 0 }}>Transfer.</p></div>
        <div><p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{fmtMoney(data.otro)}</p><p style={{ fontSize: 10, color: C.textFainter, textTransform: 'uppercase', margin: 0 }}>Otro</p></div>
      </div>

      {evento.docenasExtra != null && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', marginBottom: 12 }} />
          <p style={{ fontSize: 12, color: C.textFainter, margin: 0 }}>
            {evento.docenasExtra > 0
              ? `🟡 Quedan ${fmtDocenas(evento.docenasExtra)} docenas pendientes de venta. Los integrantes pueden cargar nuevos pedidos.`
              : '✅ No quedan docenas pendientes de venta.'}
          </p>
        </>
      )}
    </div>
  );
}

// ---------- Tesorería Tab ----------
function TesoreriaTab({ pedidos, setPedidos, evento, setEvento }) {
  const [busqueda, setBusqueda] = useState('');

  const filtrar = (lista) => {
    const q = norm(busqueda.trim());
    if (!q) return lista;
    return lista.filter((p) => norm(p.apellido).includes(q));
  };

  const pendientes = ordenarPorApellidoNombre(filtrar(pedidos.filter((p) => !p.entregado)));
  const entregados = ordenarPorApellidoNombre(filtrar(pedidos.filter((p) => p.entregado)));

  const marcarEntregado = (id, formaPago) => {
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, entregado: true, formaPagoCobro: formaPago } : p)));
  };
  const desmarcar = (id) => {
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, entregado: false, formaPagoCobro: null } : p)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {evento.estado === 'venta' && <CierreJornada pedidos={pedidos} evento={evento} setEvento={setEvento} />}
      {evento.estado !== 'venta' && evento.docenasExtra > 0 && <VentasExtraPanel evento={evento} setEvento={setEvento} pedidos={pedidos} />}

      <SearchBox value={busqueda} onChange={setBusqueda} placeholder="Buscar comprador por apellido..." />

      <div>
        <SectionLabel>Pendientes de entrega ({pendientes.length})</SectionLabel>
        {pendientes.length === 0 ? (
          <p style={{ fontSize: 14, color: C.textFaint, textAlign: 'center', padding: '24px 0' }}>
            {busqueda ? 'No se encontraron pedidos con ese apellido.' : 'No quedan pedidos pendientes 🎉'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {pendientes.map((p) => <EntregaCard key={p.id} pedido={p} onConfirmar={(fp) => marcarEntregado(p.id, fp)} />)}
          </div>
        )}
      </div>

      <div>
        <SectionLabel>Entregados ({entregados.length})</SectionLabel>
        {entregados.length === 0 ? (
          <p style={{ fontSize: 14, color: C.textFaint, textAlign: 'center', padding: '24px 0' }}>
            {busqueda ? 'No se encontraron pedidos con ese apellido.' : 'Todavía no se entregó ningún pedido.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {entregados.map((p) => (
              <div key={p.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontWeight: 600, color: C.text, fontSize: 14, margin: 0 }}>{p.nombre} {p.apellido}</p>
                  <p style={{ fontSize: 12, color: C.textSoft, margin: '2px 0 0' }}>{fmtDocenas(p.docenas)} doc. · {p.modalidad} · cobrado: {p.formaPagoCobro}</p>
                  {p.observaciones && (
                    <p style={{ fontSize: 12, color: C.textFaint, margin: '4px 0 0', fontStyle: 'italic' }}>"{p.observaciones}"</p>
                  )}
                </div>
                <button onClick={() => desmarcar(p.id)} style={{ fontSize: 12, color: C.primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Deshacer</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EntregaCard({ pedido, onConfirmar }) {
  const [showPago, setShowPago] = useState(false);

  if (pedido.pagado === 'si') {
    return (
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 600, color: C.text, fontSize: 14, margin: 0 }}>{pedido.nombre} {pedido.apellido}</p>
            <p style={{ fontSize: 12, color: C.textSoft, margin: '2px 0 0' }}>{fmtDocenas(pedido.docenas)} doc. · {pedido.modalidad} · {pedido.horario}</p>
            <p style={{ fontSize: 10, color: C.green, fontWeight: 600, margin: '4px 0 0' }}>Ya pagó al encargar ({pedido.formaPagoPrevista})</p>
            {pedido.observaciones && (
              <p style={{ fontSize: 12, color: C.textFaint, margin: '4px 0 0', fontStyle: 'italic' }}>"{pedido.observaciones}"</p>
            )}
          </div>
          <button onClick={() => onConfirmar(pedido.formaPagoPrevista || 'Otro')} style={{ background: C.green, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            Entregar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontWeight: 600, color: C.text, fontSize: 14, margin: 0 }}>{pedido.nombre} {pedido.apellido}</p>
          <p style={{ fontSize: 12, color: C.textSoft, margin: '2px 0 0' }}>{fmtDocenas(pedido.docenas)} doc. · {pedido.modalidad} · {pedido.horario}</p>
          <p style={{ fontSize: 10, color: C.textFaint, margin: '4px 0 0' }}>
            Previsto: {pedido.formaPagoPrevista || 'sin especificar'}
          </p>
          {pedido.observaciones && (
            <p style={{ fontSize: 12, color: C.textFaint, margin: '4px 0 0', fontStyle: 'italic' }}>"{pedido.observaciones}"</p>
          )}
        </div>
        {!showPago && (
          <button onClick={() => setShowPago(true)} style={{ background: C.primary, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
            Entregar
          </button>
        )}
      </div>

      {showPago && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, textTransform: 'uppercase', marginBottom: 8 }}>¿Cómo pagó?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['Efectivo', 'Transferencia'].map((fp) => (
              <button key={fp} onClick={() => onConfirmar(fp)} style={{ padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, background: C.green, color: '#fff', border: 'none', cursor: 'pointer' }}>{fp}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CierreJornada({ pedidos, evento, setEvento }) {
  const [precio, setPrecio] = useState('');
  const [extra, setExtra] = useState('');
  const [step, setStep] = useState('precio');

  const pendientes = pedidos.filter((p) => !p.entregado).length;

  const confirmarPrecio = () => {
    if (!precio || Number(precio) <= 0) return;
    setEvento((e) => ({ ...e, precioDocena: Number(precio) }));
    setStep('extra');
  };

  const confirmarExtra = () => {
    const val = extra === '' ? 0 : Number(extra);
    setEvento((e) => ({ ...e, docenasExtra: val, estado: val > 0 ? 'ventas_extra' : 'cerrado' }));
  };

  return (
    <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lock size={16} color={C.primary} />
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Cierre de jornada</h2>
      </div>

      {pendientes > 0 && (
        <p style={{ fontSize: 12, color: C.primary, background: C.primarySoft, borderRadius: 10, padding: 10, margin: 0 }}>
          ⚠️ Quedan {pendientes} pedidos sin marcar como entregados. Podés cerrar igual, pero revisá antes si es posible.
        </p>
      )}

      {step === 'precio' && (
        <>
          <Field label="Precio de venta por docena">
            <input type="number" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} style={inputStyle} placeholder="Ej: 6000" />
          </Field>
          <button onClick={confirmarPrecio} style={{ ...btnPrimary, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            Confirmar precio <ChevronRight size={16} />
          </button>
        </>
      )}

      {step === 'extra' && (
        <>
          <Field label="¿Cuántas docenas quedaron pendientes de venta?">
            <input type="number" inputMode="decimal" step="0.5" value={extra} onChange={(e) => setExtra(e.target.value)} style={inputStyle} placeholder="0" />
          </Field>
          <p style={{ fontSize: 12, color: C.textFaint, margin: 0 }}>
            Si quedaron docenas fabricadas de más, los integrantes podrán seguir cargando pedidos hasta cubrir esa cantidad.
          </p>
          <button onClick={confirmarExtra} style={{ ...btnPrimary, padding: '12px 0' }}>Cerrar jornada</button>
        </>
      )}
    </div>
  );
}

function VentasExtraPanel({ evento, setEvento }) {
  const [restantes, setRestantes] = useState(evento.docenasExtra);

  const actualizar = (val) => {
    const v = Math.max(0, val);
    setRestantes(v);
    setEvento((e) => ({ ...e, docenasExtra: v, estado: v === 0 ? 'cerrado' : 'ventas_extra' }));
  };

  return (
    <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ ...h2Style, marginBottom: 0 }}>Venta de docenas extra</h2>
      <p style={{ fontSize: 14, color: C.textSoft, margin: 0 }}>Quedan disponibles: <span style={{ fontWeight: 700 }}>{fmtDocenas(evento.docenasExtra)}</span> docenas.</p>
      <p style={{ fontSize: 12, color: C.textFaint, margin: 0 }}>
        A medida que los integrantes vayan cargando estos pedidos extra y vos los cobres, actualizá manualmente cuántas quedan. Al llegar a 0 la venta del mes se cierra definitivamente.
      </p>
      <Field label="Docenas extra restantes">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => actualizar(restantes - 0.5)} style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', border: `1px solid ${C.amberBorder}`, fontWeight: 700, cursor: 'pointer' }}>−</button>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 20, color: C.text }}>{fmtDocenas(restantes)}</div>
          <button onClick={() => actualizar(restantes + 0.5)} style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', border: `1px solid ${C.amberBorder}`, fontWeight: 700, cursor: 'pointer' }}>+</button>
        </div>
      </Field>
    </div>
  );
}

// ---------- Admin Tab ----------
function AdminTab({ users, setUsers, evento, setEvento }) {
  const [showForm, setShowForm] = useState(false);
  const integrantes = users.filter((u) => u.rol === 'integrante');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Configurar evento del mes</h2>
        <Field label="Día de retiro">
          <input type="date" value={evento.diaRetiro} onChange={(e) => setEvento((ev) => ({ ...ev, diaRetiro: e.target.value }))} style={inputStyle} />
        </Field>
        <Field label="Tesorero/a del evento">
          <select value={evento.tesoreroId || ''} onChange={(e) => setEvento((ev) => ({ ...ev, tesoreroId: e.target.value || null }))} style={inputStyle}>
            <option value="">Sin asignar</option>
            {integrantes.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
          </select>
        </Field>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ ...h2Style, marginBottom: 0 }}>Integrantes ({integrantes.length})</h2>
          <button onClick={() => setShowForm(true)} style={{ color: C.primary, fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={16} /> Agregar
          </button>
        </div>

        {showForm && (
          <NuevoIntegranteForm
            onSave={(data) => { setUsers((prev) => [...prev, { ...data, id: uid(), rol: 'integrante' }]); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {integrantes.map((u) => (
            <div key={u.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 600, color: C.text, fontSize: 14, margin: 0 }}>{u.nombre} {u.apellido}</p>
                <p style={{ fontSize: 12, color: C.textFaint, margin: 0 }}>usuario: {u.user} · clave: {u.pass}</p>
              </div>
              <button onClick={() => setUsers((prev) => prev.filter((x) => x.id !== u.id))} style={{ fontSize: 12, color: C.primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Quitar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NuevoIntegranteForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', user: '', pass: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.nombre || !form.apellido || !form.user || !form.pass) return;
    onSave(form);
  };

  return (
    <form onSubmit={submit} style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Nombre"><input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} style={inputStyle} /></Field>
        <Field label="Apellido"><input value={form.apellido} onChange={(e) => set('apellido', e.target.value)} style={inputStyle} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Usuario"><input value={form.user} onChange={(e) => set('user', e.target.value)} style={inputStyle} autoCapitalize="none" /></Field>
        <Field label="Contraseña"><input value={form.pass} onChange={(e) => set('pass', e.target.value)} style={inputStyle} /></Field>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Cancelar</button>
        <button type="submit" style={{ ...btnPrimary, flex: 1, padding: '10px 0' }}>Guardar</button>
      </div>
    </form>
  );
}
