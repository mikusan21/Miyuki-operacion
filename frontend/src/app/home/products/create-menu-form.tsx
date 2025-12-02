"use client";

import {useMemo, useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import type {PlatoMenuItem as BasePlatoMenuItem} from "@/lib/api";
import {crearMenu} from "@/lib/api";

// Extendemos el tipo base para que incluya "segundo"
type PlatoMenuItem = BasePlatoMenuItem & {
  tipo: "entrada" | "segundo" | "postre" | "bebida" | "plato" | "piqueo";
};

interface Props {
  platos: BasePlatoMenuItem[];
  sedeOptions: string[];
  onCancel: () => void;
  onCreated?: () => void;
}

export default function CreateMenuForm({platos, sedeOptions, onCancel, onCreated}: Props) {
  const [fecha, setFecha] = useState("");
  const [precioNormal, setPrecioNormal] = useState<number>(0);
  const [precioEjecutivo, setPrecioEjecutivo] = useState<number>(0);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<string>("");
  const [normalEntrada, setNormalEntrada] = useState("");
  const [normalSegundo, setNormalSegundo] = useState("");
  const [normalBebida, setNormalBebida] = useState("");

  const [ejEntradas, setEjEntradas] = useState<string[]>([]);
  const [ejSegundos, setEjSegundos] = useState<string[]>([]);
  const [ejPostres, setEjPostres] = useState<string[]>([]);
  const [ejBebidas, setEjBebidas] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platosTyped = platos as PlatoMenuItem[];
  const entradas = useMemo(() => platosTyped.filter((p: PlatoMenuItem) => p.tipo === "entrada"), [platosTyped]);
  const segundos = useMemo(() => platosTyped.filter((p: PlatoMenuItem) => p.tipo === "segundo"), [platosTyped]);
  const postres = useMemo(() => platosTyped.filter((p: PlatoMenuItem) => p.tipo === "postre"), [platosTyped]);
  const bebidas = useMemo(() => platosTyped.filter((p: PlatoMenuItem) => p.tipo === "bebida"), [platosTyped]);

  const toggleArray = (arr: string[], setArr: (v: string[]) => void, id: string) => {
    if (arr.includes(id)) setArr(arr.filter((x) => x !== id));
    else setArr([...arr, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fecha || !sedeSeleccionada) {
      setError("Selecciona fecha y sede");
      return;
    }

    if (!normalEntrada || !normalSegundo || !normalBebida) {
      setError("Selecciona entrada, segundo y bebida para el menú normal");
      return;
    }

    setIsSubmitting(true);
    try {
      await crearMenu({
        fecha,
        sede: sedeSeleccionada,
        precioNormal,
        precioEjecutivo,
        normal: {entrada: normalEntrada, segundo: normalSegundo, bebida: normalBebida},
        ejecutivo: {entradas: ejEntradas, segundos: ejSegundos, postres: ejPostres, bebidas: ejBebidas},
      });

      onCreated?.();
    } catch (err) {
      console.error("Error creando menú:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Fecha*</label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Sede*</label>
          <Select value={sedeSeleccionada} onValueChange={setSedeSeleccionada}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una sede" />
            </SelectTrigger>
            <SelectContent>
              {sedeOptions.map((sede) => (
                <SelectItem key={sede} value={sede}>{sede}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Precio Normal (S/)</label>
          <Input type="number" step="0.01" value={precioNormal} onChange={(e) => setPrecioNormal(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Precio Ejecutivo (S/)</label>
          <Input type="number" step="0.01" value={precioEjecutivo} onChange={(e) => setPrecioEjecutivo(Number(e.target.value))} />
        </div>
      </div>

      <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <h3 className="font-semibold text-foreground">Menú Normal</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm">Entrada</label>
            <select value={normalEntrada} onChange={(e) => setNormalEntrada(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              <option value="">Seleccionar</option>
              {entradas.map((p) => (<option key={p._id} value={p._id}>{p.nombre} - {(p.sede as any)?.nombre ?? p.sede}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Segundo</label>
            <select value={normalSegundo} onChange={(e) => setNormalSegundo(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              <option value="">Seleccionar</option>
              {segundos.map((p) => (<option key={p._id} value={p._id}>{p.nombre} - {(p.sede as any)?.nombre ?? p.sede}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Bebida</label>
            <select value={normalBebida} onChange={(e) => setNormalBebida(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              <option value="">Seleccionar</option>
              {bebidas.map((p) => (<option key={p._id} value={p._id}>{p.nombre} - {(p.sede as any)?.nombre ?? p.sede}</option>))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Menú Ejecutivo (opcional)</h3>
          <span className="text-xs text-foreground-secondary">Selecciona varias si aplica</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Entradas</p>
            <div className="mt-2 max-h-32 overflow-auto rounded-md border p-2 space-y-1">
              {entradas.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ejEntradas.includes(p._id)} onChange={() => toggleArray(ejEntradas, setEjEntradas, p._id)} />
                  <span>{p.nombre} - {(p.sede as any)?.nombre ?? p.sede}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Segundos</p>
            <div className="mt-2 max-h-32 overflow-auto rounded-md border p-2 space-y-1">
              {segundos.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ejSegundos.includes(p._id)} onChange={() => toggleArray(ejSegundos, setEjSegundos, p._id)} />
                  <span>{p.nombre} - {(p.sede as any)?.nombre ?? p.sede}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Postres</p>
            <div className="mt-2 max-h-32 overflow-auto rounded-md border p-2 space-y-1">
              {postres.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ejPostres.includes(p._id)} onChange={() => toggleArray(ejPostres, setEjPostres, p._id)} />
                  <span>{p.nombre} - {(p.sede as any)?.nombre ?? p.sede}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Bebidas</p>
            <div className="mt-2 max-h-32 overflow-auto rounded-md border p-2 space-y-1">
              {bebidas.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ejBebidas.includes(p._id)} onChange={() => toggleArray(ejBebidas, setEjBebidas, p._id)} />
                  <span>{p.nombre} - {(p.sede as any)?.nombre ?? p.sede}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && <div className="text-sm text-error">{error}</div>}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear menú'}</Button>
      </div>
    </form>
  );
}
