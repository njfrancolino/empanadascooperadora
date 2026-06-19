'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection, doc, onSnapshot, setDoc, addDoc, deleteDoc, updateDoc, getDocs, query,
} from 'firebase/firestore';
import { db } from './firebase';

// ---------- Usuarios ----------
export function useUsers() {
  const [users, setUsers] = useState(null); // null = cargando

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), async (snap) => {
      if (snap.empty) {
        // Primera vez: sembramos el usuario Administrador
        await setDoc(doc(db, 'users', 'admin'), {
          user: 'Francolino',
          pass: 'abcde',
          nombre: 'Francolino',
          rol: 'admin',
        });
        return; // el propio onSnapshot se va a volver a disparar con el nuevo doc
      }
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const addUser = useCallback(async (data) => {
    await addDoc(collection(db, 'users'), { ...data, rol: 'integrante' });
  }, []);

  const removeUser = useCallback(async (id) => {
    await deleteDoc(doc(db, 'users', id));
  }, []);

  return { users, addUser, removeUser };
}

// ---------- Pedidos ----------
export function usePedidos() {
  const [pedidos, setPedidos] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pedidos'), (snap) => {
      setPedidos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const addPedido = useCallback(async (pedido) => {
    await addDoc(collection(db, 'pedidos'), pedido);
  }, []);

  const updatePedido = useCallback(async (id, changes) => {
    await updateDoc(doc(db, 'pedidos', id), changes);
  }, []);

  const deletePedido = useCallback(async (id) => {
    await deleteDoc(doc(db, 'pedidos', id));
  }, []);

  return { pedidos, addPedido, updatePedido, deletePedido };
}

// ---------- Evento (documento único: evento/actual) ----------
const EVENTO_DEFAULT = {
  diaRetiro: new Date().toISOString().slice(0, 10),
  tesoreroId: null,
  estado: 'venta',
  precioDocena: null,
  docenasExtra: null,
};

export function useEvento() {
  const [evento, setEvento] = useState(null);

  useEffect(() => {
    const ref = doc(db, 'evento', 'actual');
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        await setDoc(ref, EVENTO_DEFAULT);
        return;
      }
      setEvento(snap.data());
    });
    return unsub;
  }, []);

  const updateEvento = useCallback(async (changesOrFn) => {
    const ref = doc(db, 'evento', 'actual');
    if (typeof changesOrFn === 'function') {
      // Para mantener compatibilidad con setEvento(prev => ...) del prototipo,
      // leemos el estado actual antes de aplicar la función.
      const snap = await getDocs(query(collection(db, 'evento')));
      const current = snap.docs.find((d) => d.id === 'actual')?.data() || EVENTO_DEFAULT;
      const next = changesOrFn(current);
      await setDoc(ref, next, { merge: true });
    } else {
      await setDoc(ref, changesOrFn, { merge: true });
    }
  }, []);

  return { evento, updateEvento };
}
