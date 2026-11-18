# Aguilón 22K · Seguimiento

App web instalable (PWA) para seguir el plan de carrera hacia el **Trail El Aguilón Media 22K** (17 de abril de 2027).

- **Hoy**: la sesión del día, la próxima, la semana en curso y lo que queda sin apuntar.
- **Plan**: las 23 semanas, de lunes a sábado, con el estado de cada sesión.
- **Historial**: todo lo apuntado, con km, tiempo, ritmo, desnivel, esfuerzo y sensaciones. También salidas fuera del plan.
- **Progreso**: totales, tiempo y km por semana, ritmo de los rodajes suaves y evolución del test de referencia.

Los datos se guardan solo en el teléfono (localStorage). Desde *Progreso → Tus datos* se puede guardar una copia (JSON), restaurarla o exportar a Excel (CSV).

## Instalar en el iPhone

1. Abre la web en **Safari**.
2. Pulsa **Compartir** y elige **Añadir a pantalla de inicio**.

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Estructura de la app |
| `styles.css` | Estilos (claro y oscuro) |
| `plan.js` | El plan de entrenamiento: fases y sesiones de cada semana |
| `app.js` | Lógica: registro, historial, gráficas, copias |
| `sw.js` | Service worker: funcionamiento sin conexión |

Para cambiar el plan, edita `plan.js`. Después sube `VERSION` en `sw.js` para que el teléfono descargue la versión nueva.

## Publicación

La web se sirve con GitHub Pages desde la rama `gh-pages`: https://cristianpg25.github.io/aguilon-app/

Para publicar cambios, súbelos a `main` y también a `gh-pages` (`git push origin main main:gh-pages`).
