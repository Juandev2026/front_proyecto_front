# Eventos Implementados - Google Analytics 4

## Resumen

Este documento lista todos los eventos de GA4 implementados en la plataforma LCI.

---

## 📊 Eventos Automáticos (GA4)

Estos eventos se rastrean automáticamente sin configuración adicional:

| Evento | Descripción | Cuándo se dispara |
|--------|-------------|-------------------|
| `page_view` | Vista de página | Cada vez que se carga una página |
| `session_start` | Inicio de sesión | Primera interacción del usuario |
| `first_visit` | Primera visita | Primera vez que un usuario visita el sitio |
| `scroll` | Scroll profundo | Usuario hace scroll >90% de la página |
| `user_engagement` | Tiempo activo | Usuario pasa tiempo en la página (>5 seg) |
| `click` | Clic en enlace externo | Clic en enlaces que salen del sitio |

---

## 🎓 Eventos de Cursos

### `view_course`

**Descripción:** Se dispara cuando un usuario entra a la página de detalle de un curso.

**Ubicación:** `src/pages/cursos/[id].tsx`

**Parámetros:**
```typescript
{
  course_id: string,      // ID del curso
  course_name: string,    // Nombre del curso
  category: string        // ID de categoría
}
```

**Ejemplo:**
```typescript
track('view_course', {
  course_id: "123",
  course_name: "geometria_trigonometria",
  category: "1"
});
```

---

### `course_cta_click`

**Descripción:** Se dispara cuando un usuario hace clic en "Comprar ahora" o "Chatea con nosotros".

**Ubicación:** `src/pages/cursos/[id].tsx`

**Parámetros:**
```typescript
{
  course_id: string,
  course_name: string,
  cta_type: 'comprar' | 'inscribirse',
  price: number
}
```

**Ejemplo:**
```typescript
track('course_cta_click', {
  course_id: "123",
  course_name: "geometria_trigonometria",
  cta_type: "comprar",
  price: 99.99
});
```

---

## 📚 Eventos de Materiales

### `material_download`

**Descripción:** Se dispara cuando un usuario descarga un material educativo.

**Ubicación:** `src/pages/materials.tsx`

**Parámetros:**
```typescript
{
  material_id: string,
  material_name: string,
  file_type: string       // "pdf", "zip", etc.
}
```

**Ejemplo:**
```typescript
track('material_download', {
  material_id: "456",
  material_name: "Guía de Álgebra",
  file_type: "pdf"
});
```

---

## 🔍 Eventos de Búsqueda

### `search`

**Descripción:** Se dispara cuando un usuario realiza una búsqueda en la página de materiales.

**Ubicación:** `src/pages/materials.tsx`

**Parámetros:**
```typescript
{
  search_term: string,
  results_count?: number  // Opcional: número de resultados
}
```

**Ejemplo:**
```typescript
track('search', {
  search_term: "matemáticas",
  results_count: 5
});
```

---

## ⏱️ Eventos de Engagement

### Tiempo en Página (Automático)

**Descripción:** Se rastrea automáticamente el tiempo que un usuario pasa en cada página.

**Ubicación:** `src/hooks/useAnalytics.ts` (automático en todas las páginas)

**Condición:** Solo se registra si el usuario pasa >5 segundos en la página.

**Parámetros:**
```typescript
{
  engagement_time_msec: number,  // Tiempo en milisegundos
  page_path: string              // Ruta de la página
}
```

---

## 📋 Eventos Pendientes (Futuras Implementaciones)

### Videos

- `video_start` - Usuario inicia un video
- `video_progress` - Progreso 25%, 50%, 75%, 100%
- `video_complete` - Video finalizado

### Exámenes

- `exam_start` - Usuario inicia un examen
- `exam_complete` - Examen finalizado
- `exam_abandon` - Usuario abandona sin terminar

---

## 🛠️ Uso en Código

### Importar Hook

```typescript
import { useAnalytics } from '../hooks/useAnalytics';
```

### Usar en Componente

```typescript
const MiComponente = () => {
  const { track } = useAnalytics();

  const handleClick = () => {
    track('view_course', {
      course_id: "123",
      course_name: "mi_curso",
      category: "matematicas"
    });
  };

  return <button onClick={handleClick}>Ver Curso</button>;
};
```

---

## 📊 Ver Datos en GA4

### Tiempo Real (últimos 30 min):
```
GA4 Dashboard → Reports → Realtime
```

### Reportes Completos (24-48h delay):
```
GA4 Dashboard → Reports → Engagement → Events
```

### Exploración Personalizada:
```
GA4 Dashboard → Explore → Blank
```

---

## 🔧 Debugging

### En Desarrollo:

Los eventos se loguean en consola:
```
[GA4 Event] view_course {course_id: "123", ...}
```

### En Producción:

Usa GA4 DebugView:
```
GA4 Dashboard → Admin → DebugView
```

---

*Última actualización: 2026-01-06*
