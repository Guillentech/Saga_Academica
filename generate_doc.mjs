import fs from 'fs';
import * as docx from 'docx';

const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        // Título del documento
        new Paragraph({
          text: "GUION OFICIAL DE EXPOSICIÓN",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          text: "Proyecto: SAGA ACADÉMICA — LMS RPG 2D",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 }
        }),
        
        // Metadatos
        new Paragraph({
          children: [
            new TextRun({ text: "Integrantes del equipo: ", bold: true }),
            new TextRun("Guillen y Alex (Programadores) + 3 Compañeros (Expositores)\n"),
            new TextRun({ text: "Duración estimada: ", bold: true }),
            new TextRun("7 a 10 minutos\n"),
            new TextRun({ text: "Fecha: ", bold: true }),
            new TextRun("Día de la Exposición")
          ],
          spacing: { after: 300 }
        }),

        // Tabla de distribución
        new Paragraph({
          text: "1. DISTRIBUCIÓN DE ROLES Y TIEMPOS",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 }
        }),
        new Paragraph({
          text: "Para asegurar que todos participen de forma fluida y natural, la exposición se divide en 5 bloques estratégicos:",
          spacing: { after: 150 }
        }),

        // Bloque 1
        new Paragraph({
          children: [
            new TextRun({ text: "Bloque 1: Introducción y Motivación (Compañero 1 - Aprox. 1 min)\n", bold: true }),
            new TextRun("• Tema: Presentación del equipo, nombre del proyecto ('Saga Académica') y el problema que resuelve la educación tradicional aburrida.\n• Enfoque: Captar la atención del público y del profesor con una temática moderna de videojuego RPG.")
          ],
          spacing: { after: 150 }
        }),

        // Bloque 2
        new Paragraph({
          children: [
            new TextRun({ text: "Bloque 2: Experiencia del Estudiante y Mapa 2D (Compañero 2 - Aprox. 2 min)\n", bold: true }),
            new TextRun("• Tema: Cómo el estudiante (Héroe del Gremio) interactúa con la plataforma, explora los biomas, lee los pergaminos y sube de nivel.\n• Enfoque: Explicar la jugabilidad y la pedagogía detrás de la gamificación.")
          ],
          spacing: { after: 150 }
        }),

        // Bloque 3
        new Paragraph({
          children: [
            new TextRun({ text: "Bloque 3: Evaluaciones, Logros y Panel del Profesor (Compañero 3 - Aprox. 2 min)\n", bold: true }),
            new TextRun("• Tema: Jefes finales (exámenes automáticos), misiones de laboratorio, sistema de logros/medallas y el rol del Game Master (Profesor).\n• Enfoque: Mostrar el valor de gestión docente y retroalimentación.")
          ],
          spacing: { after: 150 }
        }),

        // Bloque 4
        new Paragraph({
          children: [
            new TextRun({ text: "Bloque 4: Arquitectura y Retos Técnicos (Guillen o Alex - Aprox. 2 min)\n", bold: true }),
            new TextRun("• Tema: Stack tecnológico (React 19, Node.js, Express, SQLite), organización del código unificado y el Copiloto IA (Oráculo).\n• Enfoque: Explicar cómo se estructuró la base de datos y la robustez del sistema.")
          ],
          spacing: { after: 150 }
        }),

        // Bloque 5
        new Paragraph({
          children: [
            new TextRun({ text: "Bloque 5: Demostración en Vivo y Conclusión (Alex o Guillen - Aprox. 2 min)\n", bold: true }),
            new TextRun("• Tema: Demo práctica en vivo de la aplicación corriendo, inicio de sesión y cierre con conclusiones e impacto del proyecto.\n• Enfoque: Ver el software en acción y cerrar con broche de oro.")
          ],
          spacing: { after: 300 }
        }),

        // GUION DETALLADO
        new Paragraph({
          text: "2. GUION PASO A PASO PARA CADA EXPOSITOR",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 }
        }),

        // --- EXPOSITOR 1 ---
        new Paragraph({
          children: [
            new TextRun({ text: "▶ EXPOSITOR 1 (Compañero 1): Introducción y Propósito\n", bold: true }),
            new TextRun("Diapositiva sugerida: Portada de 'Saga Académica' con estética RPG y eslogan.\n\n"),
            new TextRun("\"Buenos días, profesor y compañeros. Hoy nuestro equipo tiene el agrado de presentarles "),
            new TextRun({ text: "Saga Académica", bold: true }),
            new TextRun(", una plataforma de gestión y evaluación de aprendizaje (LMS) diseñada con una inmersiva temática de videojuego RPG de fantasía 2D.\n\n"),
            new TextRun("¿Cuál fue el problema que detectamos? Las plataformas educativas tradicionales suelen ser monótonas, frías y poco motivadoras para los estudiantes. Los alumnos ven el estudio como una obligación tediosa en lugar de un reto emocionante. Por eso, decidimos fusionar la pedagogía con la gamificación: aquí, los estudiantes no son simples alumnos, son "),
            new TextRun({ text: "Héroes del Gremio", italics: true }),
            new TextRun(" que suben de nivel, ganan experiencia y superan mazmorras temáticas mientras aprenden estadística y otras materias. Doy paso a mi compañero para explicar cómo funciona la experiencia del estudiante.\"")
          ],
          spacing: { after: 200 }
        }),

        // --- EXPOSITOR 2 ---
        new Paragraph({
          children: [
            new TextRun({ text: "▶ EXPOSITOR 2 (Compañero 2): Experiencia del Héroe y Mapa 2D\n", bold: true }),
            new TextRun("Diapositiva sugerida: Captura del Mapa 2D de biomas (bosques, mazmorras, ruinas).\n\n"),
            new TextRun("\"Gracias. Como mencionó mi compañero, al ingresar a la plataforma con su código único de héroe, el estudiante se encuentra con un "),
            new TextRun({ text: "Mapa 2D de biomas", bold: true }),
            new TextRun(". Cada unidad o tema académico se representa como una zona a explorar.\n\n"),
            new TextRun("Antes de enfrentarse a los exámenes, los héroes acceden a los "),
            new TextRun({ text: "Pergaminos de Estudio", italics: true }),
            new TextRun(", que contienen todo el material didáctico, fórmulas y ejemplos prácticos explicados de forma clara. Además, contamos con un "),
            new TextRun({ text: "Campo de Entrenamiento", italics: true }),
            new TextRun(", un espacio de práctica adaptativa donde pueden repasar preguntas y fallos anteriores sin arriesgar su nota. A continuación, mi compañero les explicará cómo se evalúa el conocimiento en este mundo.\"")
          ],
          spacing: { after: 200 }
        }),

        // --- EXPOSITOR 3 ---
        new Paragraph({
          children: [
            new TextRun({ text: "▶ EXPOSITOR 3 (Compañero 3): Evaluaciones, Logros y Panel Docente\n", bold: true }),
            new TextRun("Diapositiva sugerida: Pantalla de combate contra un 'Jefe Final' y galería de medallas/logros.\n\n"),
            new TextRun("\"En Saga Académica, las evaluaciones son llamadas "),
            new TextRun({ text: "Jefes Finales", bold: true }),
            new TextRun(". Son exámenes de opción múltiple con corrección automática, retroalimentación inmediata por cada pregunta y un sistema justo de un solo intento por mazmorra. También tenemos las "),
            new TextRun({ text: "Misiones de Laboratorio", italics: true }),
            new TextRun(", que son tareas prácticas con subida de archivos.\n\n"),
            new TextRun("Para mantener motivados a los alumnos, implementamos un sistema de "),
            new TextRun({ text: "19 logros desbloqueables", bold: true }),
            new TextRun(" (como 'Primer Sangre' o 'Racha de 7 Días') con alertas animadas y bonificaciones de XP. Por otro lado, los profesores actúan como "),
            new TextRun({ text: "Game Masters", italics: true }),
            new TextRun(", contando con un panel completo para crear temas, calificar entregas y supervisar el progreso de todo el gremio. Ahora, para profundizar en cómo construimos esto por debajo, cedo la palabra a nuestro programador.\"")
          ],
          spacing: { after: 200 }
        }),

        // --- EXPOSITOR 4 ---
        new Paragraph({
          children: [
            new TextRun({ text: "▶ EXPOSITOR 4 (Guillen o Alex): Arquitectura y Desarrollo Técnico\n", bold: true }),
            new TextRun("Diapositiva sugerida: Esquema técnico (React, Vite, Node.js, Express, SQLite).\n\n"),
            new TextRun("\"Muchas gracias. Desde el punto de vista de desarrollo, diseñamos una arquitectura moderna, rápida y robusta. En el "),
            new TextRun({ text: "Frontend", bold: true }),
            new TextRun(" utilizamos React 19 junto con Vite y React Router, creando una interfaz tipo SPA (Single Page Application) altamente responsiva, fluida y con diseño visual adaptado a la temática gamer. En el "),
            new TextRun({ text: "Backend", bold: true }),
            new TextRun(" implementamos una API RESTful desarrollada en Node.js con Express, conectada a una base de datos liviana y eficiente en "),
            new TextRun({ text: "SQLite", italics: true }),
            new TextRun(" mediante better-sqlite3.\n\n"),
            new TextRun("Además, integramos un "),
            new TextRun({ text: "Copiloto IA (El Oráculo)", bold: true }),
            new TextRun(" capaz de generar contenido dinámico, preguntas y ejemplos de apoyo automáticamente. Todo el proyecto se ejecuta de forma unificada con un solo comando gracias a una estructura optimizada. Para ver la plataforma en acción, dejo con ustedes a mi compañero.\"")
          ],
          spacing: { after: 200 }
        }),

        // --- EXPOSITOR 5 ---
        new Paragraph({
          children: [
            new TextRun({ text: "▶ EXPOSITOR 5 (Alex o Guillen): Demostración en Vivo y Conclusión\n", bold: true }),
            new TextRun("Diapositiva sugerida: Pantalla de cierre / Enlace a la app / '¡Gracias por su atención!'.\n\n"),
            new TextRun("\"(En este momento se abre el navegador en http://localhost:5173)\n\n"),
            new TextRun("Como pueden ver en pantalla, la aplicación es totalmente funcional. Vamos a iniciar sesión como Héroe... aquí tenemos el mapa de biomas, las estadísticas del personaje, y vamos a simular rápidamente una entrega de laboratorio y la visualización de medallas. También podemos entrar al panel del profesor para ver cómo califica.\n\n"),
            new TextRun("En conclusión, "),
            new TextRun({ text: "Saga Académica", bold: true }),
            new TextRun(" demuestra que la tecnología web moderna puede transformar la educación en una experiencia interactiva, entretenida y altamente efectiva. Agradecemos su atención y quedamos abiertos a cualquier pregunta o consulta por parte del profesor y del público.\"")
          ],
          spacing: { after: 300 }
        }),

        // CONSEJOS ANTE PREGUNTAS
        new Paragraph({
          text: "3. GUÍA RÁPIDA PARA PREGUNTAS DEL PROFESOR (¡MUY IMPORTANTE!)",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• Si preguntan sobre la base de datos o código: ", bold: true }),
            new TextRun("Responden Guillen o Alex („Usamos SQLite con better-sqlite3 porque permite transacciones rápidas y seguras en el servidor backend en Node.js...“).\n\n"),
            new TextRun({ text: "• Si preguntan sobre el propósito pedagógico o diseño: ", bold: true }),
            new TextRun("Responden los otros 3 compañeros („Buscamos combatir el desinterés estudiantil mediante gamificación, permitiendo que cada concepto estadístico se convierta en una misión superable...“).\n\n"),
            new TextRun({ text: "• Regla de oro de equipo: ", bold: true }),
            new TextRun("Si un compañero duda en una pregunta técnica, los programadores intervienen inmediatamente con confianza diciendo: *'Permíteme complementar esa parte técnica, profesor...'*. ¡Nadie se queda solo!")
          ],
          spacing: { after: 200 }
        })
      ]
    }
  ]
});

const buffer = await docx.Packer.toBuffer(doc);
fs.writeFileSync('Guion_Exposicion_Saga_Academica.docx', buffer);
console.log('Documento Word creado con éxito.');
