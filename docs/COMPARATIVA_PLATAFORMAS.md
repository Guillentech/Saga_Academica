# Comparativa de plataformas y hoja de ruta para Saga Académica

> Fecha: noviembre 2026 · Objetivo: identificar lo mejor de plataformas similares y convertirlo en mejoras priorizadas para nuestro LMS RPG.

## 1. Resumen ejecutivo

Saga Académica ya tiene una base difícil de copiar: **mapa 2D de biomas, jefes finales, misiones, XP/niveles/HP, logros, ranking, copiloto IA y PWA**. No necesitamos reconstruir la app: necesitamos cerrar las brechas donde las plataformas líderes son mejores.

Las brechas más importantes son:

1. **Práctica adaptativa y recuperación después de fallar** (Khan Academy, Prodigy, Duolingo). Hoy un jefe tiene un solo intento y no existe un camino de refuerzo.
2. **Hábito diario visible** (Duolingo, Habitica). La racha ya se calcula internamente, pero el estudiante no la ve ni recibe una meta diaria.
3. **Analítica útil para el docente** (Canvas, Prodigy, Kahoot!). Existe libro de notas, pero no un observatorio de dominio por tema, alertas de riesgo ni dificultad por pregunta.
4. **Evaluación con rúbricas** (Canvas). La misión se califica con una nota y un comentario, sin criterios transparentes.
5. **Banco de preguntas e importación** (Kahoot!, Wayground). Hoy las preguntas se crean una a una.

La recomendación es avanzar por fases, empezando por **Práctica y hábito**, porque ataca la brecha pedagógica más grande y reutiliza datos que ya existen.

## 2. Qué hace bien cada plataforma

| Plataforma | Categoría | Lo mejor de su propuesta | Qué adaptar a Saga Académica |
|---|---|---|---|
| **Kahoot!** | Quiz en vivo | Modo concurso, generador de preguntas con IA, informes y modos de juego | Banco de preguntas, importación CSV, informe por pregunta y modo equipo |
| **Wayground (antes Quizizz)** | Evaluación gamificada | Modo en vivo y a ritmo propio, herramientas IA, adaptaciones (tiempo extra, lectura en voz alta) y reportes | Práctica a ritmo propio, adaptaciones por estudiante y etiquetas por estándar/tema |
| **HMH Classcraft** | Gamificación de aula | Equipos, misiones, jefes, poderes, rituales de clase y analítica de participación | Escuadrones, XP de equipo, poderes consumibles y rituales de clase |
| **Khan Academy / Khanmigo** | Dominio adaptativo | Ruta de dominio, práctica adaptativa, pistas, recomendaciones y panel docente | Mapa de dominio por tema, práctica con pistas y recomendación después de cada jefe |
| **Legends of Learning** | Juegos educativos | Playlists alineadas a estándares y reportes de progreso | Playlists de repaso por unidad y reportes de práctica |
| **Prodigy** | Práctica adaptativa | Dificultad adaptativa, alineación curricular y reportes para docentes y familias | Motor de dificultad, reporte familiar y alertas tempranas |
| **Canvas LMS** | LMS | SpeedGrader, rúbricas, resultados de aprendizaje, app para padres y analítica | Rúbricas, resultados por tema, vista de familia y analítica de notas |
| **Habitica** | RPG de hábitos | Bucle hábitos/diarias/recompensas, fiestas, misiones y moneda | Misiones diarias, racha, monedas y tienda de recompensas |
| **Duolingo** | Aprendizaje diario | Rachas, ligas, XP, corazones, ruta visual y notificaciones | Racha visible, meta diaria, liga semanal y recordatorios |
| **Blooket** | Repaso gamificado | Muchos modos de juego, sesiones en vivo/asíncronas y reportes | Modos de repaso y asignaciones asíncronas |
| **Gimkit** | Concurso en vivo | Kits reutilizables, modos de juego y asignaciones | Kits de preguntas y modo equipos |
| **Minecraft Education** | Mundo inmersivo | Mundos, construcción, programación, biblioteca de lecciones y gestión de aula | Retos de construcción/portafolio dentro de los biomas |
| **Edpuzzle** | Video interactivo | Preguntas incrustadas en video y seguimiento de visualización | Video con preguntas (fase posterior) |
| **Nearpod** | Lección interactiva | Diapositivas interactivas, encuestas, realidad virtual y evaluación formativa | Encuestas y actividades en vivo (fase posterior) |
| **ClassDojo** | Comunicación y cultura | Puntos de comportamiento, mensajería con familias, portafolio y stories | Comunicación con familias, habilidades blandas y portafolio |
| **Google Classroom** | Gestión de clase | Tareas, calificación, originalidad e integración con Drive/Calendar | Anuncios, calendario y integración con archivos |

## 3. Matriz de capacidades

Leyenda: ✅ implementado · 🟡 parcial · ❌ no existe.

| Capacidad | Saga Académica | Mejor referente | Brecha principal |
|---|---|---|---|
| Gamificación RPG | ✅ | Classcraft / Habitica | Ninguna: es nuestro diferenciador |
| Mapa visual de contenido | ✅ | Minecraft Education | Falta portafolio/construcción |
| Evaluación automática | ✅ | Kahoot! / Wayground | Faltan tipos de pregunta y banco |
| Práctica adaptativa | ❌ | Khan Academy / Prodigy | No hay recuperación tras fallar |
| Hábito diario | 🟡 | Duolingo / Habitica | Racha calculada pero invisible; sin meta diaria |
| Misiones diarias | ❌ | Habitica / Duolingo | No hay objetivos recurrentes |
| Analítica docente | 🟡 | Canvas / Prodigy | Hay libro de notas, no observatorio ni alertas |
| Rúbricas | ❌ | Canvas | Calificación única con comentario |
| Banco e importación de preguntas | ❌ | Kahoot! / Wayground | Creación pregunta por pregunta |
| Equipos / escuadrones | ❌ | Classcraft / Kahoot! | Solo ranking individual |
| Poderes y tienda | ❌ | Classcraft | La XP no se gasta ni desbloquea ventajas |
| Accesibilidad | 🟡 | Wayground | Responsive y PWA, sin adaptaciones por estudiante |
| Comunicación con familias | ❌ | ClassDojo / Canvas | Sin reporte ni canal familiar |
| Anuncios y calendario | ❌ | Google Classroom / ClassDojo | Sin feed de novedades |
| Video interactivo | ❌ | Edpuzzle / Nearpod | Sin video con preguntas |
| Portafolio | 🟡 | ClassDojo | Hay entregas, no galería de trabajos |
| Modo en vivo | ❌ | Kahoot! / Gimkit / Blooket | Todo es asíncrono |
| Notificaciones | ❌ | Duolingo / ClassDojo | Sin recordatorios de racha o pendientes |

## 4. Diagnóstico de Saga Académica

### Fortalezas que debemos proteger

- **Identidad RPG coherente**: mapa, biomas, pergaminos, jefes, misiones, HUD y avatares. Es más inmersiva que la mayoría de LMS.
- **Evaluación y notas separadas de la XP**: la nota de la materia (0–100) no se contamina con la progresión del héroe. Es una decisión pedagógica correcta.
- **Entrega de misiones con archivos**: ya cubre un flujo que muchos quizzes no tienen.
- **Copiloto IA con respaldo local**: funciona sin clave de API, algo valioso para colegios con conectividad limitada.
- **PWA instalable**: buena base para Android y equipos de bajo costo.

### Brechas que más limitan el aprendizaje

1. **El estudiante que falla un jefe queda sin camino.** El intento único es una regla de juego, pero no debe ser el final del aprendizaje. Falta un modo de práctica que no altere la nota.
2. **La racha existe en el código, pero no en la experiencia.** `backend/logros.js` ya calcula `rachaDias`; el estudiante no la ve ni la siente.
3. **El docente ve notas, pero no señales.** No hay alertas de estudiantes en riesgo, dominio por tema ni preguntas que todos fallan.
4. **La retroalimentación es un texto único.** Una rúbrica ayudaría al docente a calificar mejor y al estudiante a entender qué se espera.
5. **Crear evaluaciones sigue siendo artesanal.** Un banco reutilizable y la importación CSV ahorrarían horas de trabajo.

## 5. Priorización impacto / esfuerzo

Escala 1–5. Prioridad: **P1** = ahora, **P2** = siguiente, **P3** = después.

| # | Mejora | Referente | Impacto | Esfuerzo | Prioridad | Por qué |
|---|---|---|---:|---:|---|---|
| 1 | **Campo de Entrenamiento adaptativo** | Khan / Prodigy / Duolingo | 5 | 4 | P1 | Cierra el ciclo aprender → fallar → practicar → volver a intentar |
| 2 | **Racha visible + meta diaria + recompensa** | Duolingo / Habitica | 4 | 2 | P1 | Bajo esfuerzo, alto efecto en constancia; ya hay cálculo de racha |
| 3 | **Observatorio del Gremio para el docente** | Canvas / Prodigy / Kahoot! | 5 | 3 | P1 | Convierte datos existentes en decisiones: riesgo, dominio y dificultad |
| 4 | **Rúbricas de misión** | Canvas | 4 | 3 | P2 | Mejora transparencia y consistencia de la calificación |
| 5 | **Banco de preguntas + importación CSV** | Kahoot! / Wayground | 4 | 3 | P2 | Ahorra tiempo docente y permite reutilizar contenido |
| 6 | **Escuadrones y XP de equipo** | Classcraft / Kahoot! | 4 | 4 | P2 | Aprovecha el imaginario de gremio y añade colaboración |
| 7 | **Tienda de recompensas y poderes** | Classcraft | 4 | 3 | P2 | Da uso a la XP y profundiza la fantasía RPG |
| 8 | **Misiones diarias/semanales** | Habitica / Duolingo | 4 | 3 | P2 | Refuerza el hábito con objetivos claros |
| 9 | **Adaptaciones de accesibilidad** | Wayground | 3 | 2 | P2 | Tiempo extra, lectura en voz alta y alto contraste |
| 10 | **Anuncios/feed y calendario** | Google Classroom / ClassDojo | 3 | 1 | P2 | Quick win de comunicación |
| 11 | **Reporte para familias** | ClassDojo / Canvas | 3 | 3 | P2 | Puente escuela-casa sin construir una app aparte |
| 12 | **Modo en vivo con código de sala** | Kahoot! / Gimkit / Blooket | 5 | 5 | P3 | Muy potente, pero requiere tiempo real y gestión de sala |
| 13 | **Video interactivo** | Edpuzzle / Nearpod | 3 | 5 | P3 | Alto coste de producción y almacenamiento |
| 14 | **Portafolio/galería de trabajos** | ClassDojo | 3 | 2 | P3 | Reutiliza entregas existentes |
| 15 | **Notificaciones push/email** | Duolingo / ClassDojo | 3 | 2 | P3 | Depende de infraestructura externa |

## 6. Hoja de ruta recomendada

### Fase 1 — Práctica y hábito (recomendada para empezar)

**Objetivo:** que ningún estudiante se quede sin una segunda vía de aprendizaje después de fallar, y que la constancia se vuelva visible.

1. **Campo de Entrenamiento**
   - Nueva pestaña `ENTRENO` en la hotbar del héroe.
   - Preguntas recomendadas a partir de: respuestas incorrectas de jefes, temas con bajo dominio y repaso espaciado.
   - Retroalimentación inmediata con explicación; sin nota, sin consumir el intento del jefe.
   - Barras de dominio por tema y contador de práctica.
   - Botón “Entrenar mis puntos débiles” en el resultado de un jefe.

2. **Racha y meta diaria**
   - Llama la atención sobre la racha que ya calcula `backend/logros.js`.
   - Calendario semanal, llama de racha en el HUD y meta diaria (1 actividad/día).
   - Recompensas por 3, 7, 14 y 30 días; cofres de XP o cosméticos.
   - Nuevos logros de constancia y entrenamiento.

3. **Recomendación posterior al jefe**
   - Si aprueba: siguiente jefe o misión sugerida.
   - Si falla: plan de 3 pasos con temas y preguntas concretas para entrenar.
   - Enlace directo al Campo de Entrenamiento.

**Criterios de aceptación**
- El entrenamiento no altera la nota de la materia ni la XP oficial.
- El intento único del jefe se mantiene intacto.
- La racha se actualiza con jefes, misiones y práctica.
- El docente puede ver la actividad de práctica en el perfil del estudiante.
- `npm --prefix frontend run lint` y `npm --prefix frontend run build` pasan.

### Fase 2 — Evaluación y analítica docente

1. **Observatorio del Gremio**
   - Dominio por tema, estudiantes en riesgo, actividades pendientes y tendencia semanal.
   - Dificultad por pregunta usando `detalle_respuestas` de las calificaciones.
   - Exportación CSV y alertas accionables.

2. **Rúbricas de misión**
   - Criterios con niveles y pesos definidos por el docente.
   - Calificación por criterio y total calculado.
   - Vista de rúbrica para el estudiante antes de entregar.

3. **Banco de preguntas e importación CSV**
   - Preguntas reutilizables entre evaluaciones.
   - Importación con validación y vista previa.
   - Duplicar evaluación completa.

### Fase 3 — Social, live y contenido enriquecido

1. Escuadrones con XP y misiones de equipo.
2. Tienda de recompensas, títulos y poderes consumibles.
3. Modo en vivo con código de sala y marcador en tiempo real.
4. Video interactivo y portafolio de trabajos.

## 7. Por qué empezar por la Fase 1

- **Ataca la brecha pedagógica más seria:** hoy el intento único no ofrece una ruta de recuperación.
- **Reutiliza lo que ya existe:** preguntas, calificaciones, `detalle_respuestas`, cálculo de racha y logros.
- **No toca el motor de notas:** reduce el riesgo de romper la boleta o el libro docente.
- **Es visible para el estudiante:** refuerza la identidad RPG y la sensación de progreso.
- **Prepara la Fase 2:** los datos de práctica alimentan el observatorio y las recomendaciones del docente.

## 8. Fuentes consultadas

- Kahoot! — https://kahoot.com/schools/features/
- Wayground (antes Quizizz) — https://wayground.com/
- HMH Classcraft — https://www.hmhco.com/programs/classcraft
- Khan Academy para docentes — https://www.khanacademy.org/teachers
- Legends of Learning — https://www.legendsoflearning.com/
- Prodigy para educadores — https://www.prodigygame.com/main-en/teachers
- Canvas LMS — https://www.instructure.com/canvas
- Habitica — https://habitica.com/
- Duolingo — https://www.duolingo.com/
- Blooket — https://www.blooket.com/
- Gimkit — https://www.gimkit.com/
- Minecraft Education — https://education.minecraft.net/
- Edpuzzle — https://www.edpuzzle.com/
- Nearpod — https://nearpod.com/
- ClassDojo — https://www.classdojo.com/
- Google Classroom — https://edu.google.com/workspace-for-education/classroom/

> Nota: las plataformas cambian de nombre y de funciones con frecuencia. Antes de implementar una función conviene revisar la fuente oficial y validar el detalle con el usuario.
