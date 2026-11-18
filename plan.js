/* Plan de carrera · Trail El Aguilón Media 22K
   Fuente única del plan: la usan la app y el calendario.
   Estructura semanal desde el 19 nov 2026 (pautas de un corredor de trail experimentado):
   martes rodaje suave por llano, jueves cuestas de 500 m, sábado tirada larga correr/andar. */
(function (root) {
  'use strict';

  const START = '2026-11-09';
  const RACE = '2027-04-17';

  const PH = [
    {name: 'Reincorporación', note: 'Vuelves tras el alta y entras en la estructura nueva: martes llano y suave, jueves cuestas, sábado tirada correr/andar.', rir: 'RIR 4–5'},
    {name: 'Asentamiento', note: 'El cuerpo se acostumbra al volumen: 1 h el martes, 5–6 subidas de 500 m el jueves y 2 h correr/andar el sábado.', rir: 'RIR 3'},
    {name: 'Base', note: 'Más subidas el jueves (hasta 8) y el sábado crece hasta 2 h 45 min con desnivel.', rir: 'RIR 1–2'},
    {name: 'Específica', note: 'Subidas más largas, terreno de montaña y la salida clave del 27 de marzo.', rir: 'RIR 2'},
    {name: 'Puesta a punto', note: 'Menos volumen, misma frecuencia: llegar fresco al 17 de abril.', rir: 'RIR 3'}
  ];

  const LEGN = {
    A0: 'Pierna A · Pie, tobillo y cadera', B0: 'Pierna B · Fuerza básica',
    A1: 'Pierna A · Pie, tobillo y cadera', B1: 'Pierna B · Fuerza a una pierna',
    Ad: 'Pierna A · Descarga', B1d: 'Pierna B · Descarga',
    A2: 'Pierna A · Pie, tobillo y cadera', B2: 'Pierna B · Pliometría + fuerza', B2d: 'Pierna B · Descarga',
    B2b: 'Pierna B · Pliometría + fuerza', B2bd: 'Pierna B · Descarga',
    A3: 'Pierna A · Mantenimiento', B3: 'Pierna B · Pliometría + mantenimiento', B3d: 'Pierna B · Descarga',
    A4: 'Pierna A · Puesta a punto', B4: 'Pierna B · Puesta a punto',
    A5: 'Pierna A · Suave', B5: 'Pierna B · Suave'
  };

  const dur = m => {
    const h = Math.floor(m / 60), r = m % 60;
    if (!h) return `${r} min`;
    return r ? `${h} h ${String(r).padStart(2, '0')} min` : `${h} h`;
  };

  const EASY = 'A un ritmo que puedas mantener hablando en frases completas (RPE 3–4), sin apretarte. Si se dispara la respiración, camina 1 min y sigue.';

  function suave(min, opts) {
    const o = opts || {};
    const terreno = o.senda
      ? 'Por senda o camino con algo de desnivel suave: corre las subiditas sin forzar y practica la bajada con pasos cortos y rápidos.'
      : 'Sobre todo por llano, sin meter apenas cuestas.';
    return {
      s: `Rodaje suave · ${dur(min)}`,
      d: `${o.pre ? o.pre + ' ' : ''}${dur(min)} de rodaje continuo. ${terreno} ${EASY}`,
      tag: 'suave', min
    };
  }

  function cuestas(n, dist, opts) {
    const o = opts || {};
    const d = dist || 500;
    const per = d <= 500 ? 7 : d <= 800 ? 11 : 13;
    const lbl = d >= 1000 ? `${d / 1000} km` : `${d} m`;
    return {
      s: `Cuestas · ${n} × ${lbl}`,
      d: `${o.pre ? o.pre + ' ' : ''}Calienta 2 km suaves y vete a una zona con pendiente. ${n} subidas fuertes de ${lbl} y, tras cada una, baja la misma distancia recuperando (trote muy suave o andando). «Fuerte» es RPE 7–8: respiras fuerte pero con control, y la última subida tiene que salir igual que la primera. Acaba con 5–10 min suaves.`,
      tag: 'cuestas', reps: n, dist: d, min: 20 + n * per
    };
  }

  function continua(sub, extra) {
    return {
      s: `Subida continua · ${sub} min`,
      d: `Calienta 2 km suaves. Sube ${sub} min seguidos a RPE 6–7, el esfuerzo al que subirás en carrera: corre o camina rápido según la pendiente, manda el esfuerzo y no el ritmo. Baja tranquilo.${extra ? ' ' + extra : ''} Acaba con 5–10 min suaves.`,
      tag: 'cuestas', min: 30 + sub * 2 + (extra ? 15 : 0)
    };
  }

  function larga(min, desn, extra) {
    const terreno = desn
      ? `Busca un recorrido con unos ${desn} de desnivel positivo: camina las subidas fuertes.`
      : 'Por llano o pista con poco desnivel.';
    return {
      s: `Tirada larga · ${dur(min)}${desn ? ' · ' + desn : ''}`,
      d: `${dur(min)} alternando correr y andar. Empieza con tramos de 5 min corriendo y 2 min andando, y alarga los de correr según las piernas vayan cogiendo soltura. ${terreno}${extra ? ' ' + extra : ''} Lleva agua.`,
      tag: 'larga', min
    };
  }

  function test(extra, pre) {
    return {
      s: `Test + ${extra} min suaves`,
      d: `${pre ? pre + ' ' : ''}Test de referencia: 30 min continuos a RPE 4 por tu circuito llano de siempre. Apunta los km de esos 30 min en su casilla: si a igual esfuerzo crecen, el motor mejora. Después, ${extra} min suaves.`,
      tag: 'test', min: 30 + extra
    };
  }

  const FOOD = 'Come algo cada 20–30 min desde los 45 min y bebe a sed.';
  const DESC = 'Semana de descarga.';

  const WEEKS = [
    {ph: 0, A: 'A0', B: 'B0', run: [
      {s: 'Consulta + paseo 30 min', d: 'Consulta del alta. Si el médico lo permite, paseo suave de 30 min.', tag: 'consulta', min: 30},
      {s: 'CC-A · 28 min', d: '5 min caminando + 6 × (1 min trotando / 2 min caminando) + 5 min caminando. RPE 2–3.', tag: 'cc', min: 28},
      {s: 'CC-A o caminar 40 min', d: 'CC-A (28 min) o 40 min caminando con cuestas suaves.', tag: 'cc', min: 40}]},
    {ph: 0, A: 'A0', B: 'B0', run: [
      {s: 'CC-B · 28 min', d: '5 min caminando + 6 × (2 min trotando / 1 min caminando) + 5 min caminando. RPE 2–3.', tag: 'cc', min: 28},
      cuestas(5, 500, {pre: 'Primer día de cuestas: si notas molestias en la zona operada, para y vuelve andando.'}),
      larga(120, '', 'Primera tirada larga: hoy manda andar todo lo que haga falta.')]},
    {ph: 1, A: 'A1', B: 'B1', test: 1, run: [
      test(30, 'Hoy toca medir.'),
      cuestas(5),
      larga(120)]},
    {ph: 1, A: 'A1', B: 'B1', run: [suave(60), cuestas(6), larga(120, '~150 m+')]},
    {ph: 1, A: 'A1', B: 'B1', run: [suave(60), cuestas(6), larga(130, '~200 m+')]},
    {ph: 1, A: 'Ad', B: 'B1d', test: 1, desc: 1, run: [test(15, DESC), cuestas(4, 500, {pre: DESC}), larga(80, '', DESC)]},
    {ph: 2, A: 'A2', B: 'B2', run: [suave(65), cuestas(6), larga(135, '~300 m+')]},
    {ph: 2, A: 'A2', B: 'B2', run: [suave(65), cuestas(7), larga(140, '~350 m+')]},
    {ph: 2, A: 'A2', B: 'B2', run: [suave(70), cuestas(7), larga(150, '~400 m+', 'Primera prueba de comida: ' + FOOD.charAt(0).toLowerCase() + FOOD.slice(1))]},
    {ph: 2, A: 'Ad', B: 'B2d', test: 1, desc: 1, run: [test(15, DESC), cuestas(4, 500, {pre: DESC}), larga(90, '~250 m+', DESC)]},
    {ph: 2, A: 'A2', B: 'B2b', run: [suave(70), cuestas(8), larga(150, '~450 m+', FOOD)]},
    {ph: 2, A: 'A2', B: 'B2b', run: [suave(70), cuestas(8), larga(160, '~500 m+', FOOD)]},
    {ph: 2, A: 'A2', B: 'B2b', run: [suave(75), cuestas(5, 800), larga(165, '~550 m+', FOOD)]},
    {ph: 2, A: 'Ad', B: 'B2bd', test: 1, desc: 1, run: [test(15, DESC), cuestas(4, 500, {pre: DESC}), larga(105, '~350 m+', DESC)]},
    {ph: 3, A: 'A3', B: 'B3', run: [suave(75, {senda: 1, pre: 'Ya puedes meter terreno ondulado.'}), cuestas(4, 1000), larga(170, '~600 m+', FOOD)]},
    {ph: 3, A: 'A3', B: 'B3', run: [suave(75, {senda: 1}), cuestas(5, 1000), larga(180, '~700 m+', FOOD)]},
    {ph: 3, A: 'A3', B: 'B3', run: [suave(80, {senda: 1}), cuestas(6, 800), larga(180, '~750 m+', FOOD)]},
    {ph: 3, A: 'Ad', B: 'B3d', test: 1, desc: 1, run: [test(15, DESC), cuestas(3, 1000, {pre: DESC}), larga(120, '~450 m+', DESC)]},
    {ph: 3, A: 'A3', B: 'B3', run: [suave(80, {senda: 1}), continua(15, 'Después, 3 subidas fuertes de 500 m bajando a recuperar.'), larga(190, '~800 m+', FOOD)]},
    {ph: 3, A: 'A3', B: 'B3', run: [suave(70, {senda: 1}), continua(20),
      {s: 'Salida clave · 3 h 20 min · 850–900 m+', d: '3 h 20 min con 850–900 m+. Ensayo completo del día de carrera: comida cada 20–30 min desde los 45 min, agua, ropa y zapatillas que llevarás el 17 de abril.', tag: 'clave', min: 200}]},
    {ph: 3, A: 'A3', B: 'B3', run: [suave(70, {senda: 1}), cuestas(5), larga(140, '~600 m+', 'Si puedes, por un tramo del recorrido de la carrera.')]},
    {ph: 4, A: 'A4', B: 'B4', run: [suave(50), cuestas(4), larga(80, '~300 m+', 'Empieza la puesta a punto: menos volumen, misma frecuencia.')]},
    {ph: 4, A: 'A5', B: 'B5', run: [
      {s: 'Rodaje 35 min · 4 × 1 min', d: '35 min suaves con 4 bloques de 1 min al esfuerzo que llevarás en carrera.', tag: 'suave', min: 35},
      {s: 'Rodaje 25 min + 4 progresivos', d: '25 min fáciles y 4 progresivos de 15 s: aceleras poco a poco sin esprintar.', tag: 'suave', min: 25},
      {s: 'Media 22K', d: 'Sal despacio, camina las subidas fuertes desde el principio, come pronto y termina. Nada nuevo hoy: ni comida, ni ropa, ni zapatillas.', tag: 'race', min: 0}]}
  ];

  /* A partir de la semana 3, la pierna fuerte (B) pasa al lunes y la ligera (A) al miércoles,
     para llegar frescos a las cuestas del jueves. */
  const LEG_SWAP_FROM = 3;

  root.PLAN = {START, RACE, PH, LEGN, WEEKS, LEG_SWAP_FROM, dur};
  if (typeof module !== 'undefined') module.exports = root.PLAN;
})(typeof window !== 'undefined' ? window : globalThis);
