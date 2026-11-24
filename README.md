# Centro académico

Maqueta funcional en HTML, CSS y JavaScript para organizar las 4 asignaturas del semestre, sus 3 notas parciales (`Nota 1`, `Nota 2`, `Nota 3`), tareas, materiales, agenda, horario semanal y simulador de notas.

## 5 pantallas principales en el menú + 2 vistas de detalle

1. `index.html` (**Inicio**): temporizador en vivo para la próxima entrega, desglose de pendientes, resumen de `Nota 1`, `Nota 2` y `Nota 3` por asignatura, filtro rápido de eventos y calendario semanal día por día (Lunes a Domingo).
2. `asignaturas.html` (**Asignaturas**): listado de los 4 ramos con sus 3 notas, promedio actual y buscador en vivo.
3. `agenda.html` (**Agenda**): eventos del semestre cargados desde `data.js`, buscador, filtros por ramo y tipo, marcado de eventos hechos, modal `+ Evento` y tabla de horario tipo.
4. `horario.html` (**Horario**): distribución semanal completa de bloques de clases, talleres y estudio autónomo con filtro interactivo por asignatura.
5. `simulador.html` (**Simulador**): simulador interactivo `Nota 3 vs Examen` en cuadrícula 2x2 para los 4 ramos, con cambio de color en vivo (verde, ámbar y rojo) según el riesgo académico.
6. `interfaz.html` y `evaluacion.html` (**Detalles**): detalle dinámico por ramo (`?ramo=iu|cs|mc|ad`) con 4 tareas y 4-5 materiales ficticios por asignatura, más el checklist del Trabajo 3 con modal de nuevo paso, validación y alerta de confirmación.

## Integraciones (Canvas y Google Gemini)

Desde el botón **APIs funcionando / Configurar APIs** en la barra izquierda se configuran las dos claves que alimentan la plataforma, con instrucciones paso a paso integradas para cualquier estudiante:
- **API de Canvas:** token personal desde *Canvas > Cuenta > Configuración > Integraciones aprobadas > + Nuevo token de acceso*.
- **API de Google Gemini:** clave desde [Google AI Studio](https://aistudio.google.com/apikey) para el asistente académico flotante.

## Ejecutar

Abre `index.html` directamente en el navegador o visita la versión publicada en GitHub Pages:
https://franciscofigueroa1.github.io/centro-academico-ui/

## Diseño en Figma

[Ver maqueta en Figma](https://www.figma.com/design/e6P0ex0cCNdBfD1MLxTCEl/Centro-acad%C3%A9mico-%E2%80%94-Trabajo-3?node-id=0-1&t=9baKj5Zl1L1LHGUE-1)
