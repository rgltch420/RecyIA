# ⬡ FORGEAI — Analizador de Rutinas con IA Local

> **Solución de IA aplicada al fitness** usando modelos locales privados via Ollama.  
> No es un chatbot. Es un analizador inteligente con resultados estructurados.

---

## 🎯 Qué hace

- **Analiza tu rutina actual** y la puntúa del 1 al 10
- **Sugiere progresión de pesos** para cada ejercicio (sobrecarga progresiva)
- **Genera una rutina optimizada** según tu objetivo y días disponibles
- **Detecta errores** comunes: desequilibrios musculares, volumen excesivo, falta de descanso
- **Tips personalizados** basados en tu perfil (edad, IMC, lesiones)
- **Streaming** del análisis narrativo en tiempo real

---

## ⚡ Requisitos

### 1. Instalar Ollama
```bash
# Descargar desde https://ollama.com
# Luego instalar un modelo (en orden de preferencia):
ollama run phi3        # Recomendado para máquinas con +8GB RAM
ollama run tinyllama   # Para máquinas con menos recursos (4GB)
```

**Detección automática:** La app detecta automáticamente qué modelo tienes disponible y usa el mejor. Si tienes `phi3` lo usa; si no, busca `tinyllama`, `llama3`, `mistral`, etc.

### 2. Instalar dependencias y correr
```bash
npm install
npm run dev
```

Abre `http://localhost:5173`

---

## 🏗️ Arquitectura

```
workout-ai-analyzer/
├── index.html          # UI principal
├── vite.config.js      # Proxy a Ollama (localhost:11434)
├── src/
│   ├── main.js         # Orquestador principal
│   ├── ollama.js       # Servicio Ollama (detección + streaming)
│   ├── prompts.js      # Prompts engineered para análisis estructurado
│   ├── renderer.js     # Renderiza resultados en el DOM
│   └── style.css       # Design system industrial/atlético
```

---

## 🧠 Parámetros que el usuario ingresa

| Parámetro | Por qué importa |
|-----------|----------------|
| Peso, altura, edad | Cálculo de IMC y capacidad de recuperación |
| Nivel de experiencia | Ajusta volumen e intensidad recomendados |
| Objetivo | Fuerza/Hipertrofia/Resistencia/Definición cambia todo |
| Días/semana | Para generar la rutina optimizada correcta |
| Lesiones | Evita ejercicios contraindicados |
| Ejercicio + kg + series×reps | Base para la progresión de pesos |

---

## 💡 Decisiones de diseño

- **No es chatbot**: Formulario estructurado → análisis estructurado. El usuario sabe exactamente qué ingresar.
- **Dos fases de IA**: Primero JSON estructurado para la UI, luego streaming narrativo para el detalle.
- **Temperatura baja (0.2-0.3)**: Para análisis más confiables y consistentes.
- **Fallback inteligente**: Si el modelo no retorna JSON válido, muestra la respuesta en bruto.
- **Detección automática de modelo**: phi3 > tinyllama > cualquier modelo disponible.

---

## 🚀 Evolución posible

- [ ] Historial de análisis con localStorage
- [ ] Exportar análisis como PDF
- [ ] Gráfica de progresión de pesos en el tiempo
- [ ] Soporte para múltiples rutinas guardadas
- [ ] Temporizador de descanso integrado
- [ ] Calculadora de 1RM automática
