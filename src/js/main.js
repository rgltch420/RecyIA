import { detectModel, complete, streamCompletion, ollamaState } from './api/ollama.js'
import { buildAnalysisPrompt, buildNarrativePrompt } from './services/prompts.js'
import { renderResults, parseJSON, showState, setLoadingText } from './renderer.js'

let selectedGoal = 'fuerza'
let selectedDays = 4
let exercises = []

async function init() {
  setupToggleGroups()
  setupExerciseManager()
  setupTabs()
  setupAnalyzeButton()
  await checkOllama()

  addExercise('Sentadilla', 80, 4, 8)
  addExercise('Press banca', 60, 4, 8)
  addExercise('Peso muerto', 100, 3, 5)
}

async function checkOllama() {
  const dot = document.getElementById('statusDot')
  const text = document.getElementById('statusText')

  dot.className = 'status-dot loading'
  text.textContent = 'Conectando...'

  const result = await detectModel()

  if (result.success) {
    dot.className = 'status-dot online'
    text.textContent = `${ollamaState.model} · Listo`
  } else {
    dot.className = 'status-dot error'
    text.textContent = result.error
    showOllamaError(result.error)
  }
}

function showOllamaError(msg) {
  const empty = document.getElementById('emptyState')
  empty.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:40px;margin-bottom:16px">⚠️</div>
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;margin-bottom:12px;color:var(--accent)">OLLAMA REQUERIDO</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.8;max-width:360px">
        ${msg}<br><br>
        <strong style="color:var(--text-primary)">Pasos para instalar:</strong><br>
        1. Ve a <a href="https://ollama.com" target="_blank" style="color:var(--accent)">ollama.com</a> y descárgalo<br>
        2. Ejecuta: <code style="background:var(--bg-card);padding:2px 6px;border-radius:3px;font-family:var(--font-mono)">ollama run phi3</code><br>
        3. O también: <code style="background:var(--bg-card);padding:2px 6px;border-radius:3px;font-family:var(--font-mono)">ollama run tinyllama</code>
      </div>
    </div>
  `
}

function setupToggleGroups() {
  document.getElementById('goalGroup').addEventListener('click', e => {
    const btn = e.target.closest('.btn-toggle')
    if (!btn) return
    document.querySelectorAll('#goalGroup .btn-toggle').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    selectedGoal = btn.dataset.value
  })

  document.getElementById('daysGroup').addEventListener('click', e => {
    const btn = e.target.closest('.btn-toggle')
    if (!btn) return
    document.querySelectorAll('#daysGroup .btn-toggle').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    selectedDays = parseInt(btn.dataset.value)
  })
}

function setupExerciseManager() {
  document.getElementById('addExercise').addEventListener('click', () => {
    addExercise('', '', 3, 10)
  })
}

function addExercise(name = '', weight = '', sets = 3, reps = 10) {
  const id = Date.now() + Math.random()
  const exercise = { id, name, weight, sets, reps }
  exercises.push(exercise)
  renderExerciseRow(exercise)
}

function renderExerciseRow(exercise) {
  const list = document.getElementById('exerciseList')
  const row = document.createElement('div')
  row.className = 'exercise-row'
  row.dataset.id = exercise.id

  row.innerHTML = `
    <input type="text" placeholder="Ejercicio (ej: Sentadilla)" value="${exercise.name}"
      data-field="name" />
    <input type="number" placeholder="kg" value="${exercise.weight}"
      data-field="weight" min="0" max="500" />
    <input type="text" placeholder="4×8" value="${exercise.sets}×${exercise.reps}"
      data-field="setsreps" title="Series×Reps" />
    <button class="btn-remove" title="Eliminar">×</button>
  `

 
  row.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => updateExercise(exercise.id, row))
  })

  // Remove
  row.querySelector('.btn-remove').addEventListener('click', () => {
    exercises = exercises.filter(e => e.id !== exercise.id)
    row.style.opacity = '0'
    row.style.transform = 'translateX(-10px)'
    row.style.transition = 'all 0.2s'
    setTimeout(() => row.remove(), 200)
  })

  list.appendChild(row)
}

function updateExercise(id, row) {
  const ex = exercises.find(e => e.id === id)
  if (!ex) return

  ex.name = row.querySelector('[data-field="name"]').value
  ex.weight = parseFloat(row.querySelector('[data-field="weight"]').value) || 0

  const setsreps = row.querySelector('[data-field="setsreps"]').value
  const match = setsreps.match(/(\d+)[×x](\d+)/)
  if (match) {
    ex.sets = parseInt(match[1])
    ex.reps = parseInt(match[2])
  }
}


function setupTabs() {
  document.querySelector('.tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab')
    if (!tab) return

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    tab.classList.add('active')

    const target = tab.dataset.tab
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'))
    const pane = document.getElementById(`pane-${target}`)
    if (pane) pane.classList.add('active')
  })
}


function setupAnalyzeButton() {
  document.getElementById('analyzeBtn').addEventListener('click', analyze)
}

async function analyze() {
  if (!ollamaState.available) {
    alert('⚠️ Ollama no está disponible. Instala y ejecuta Ollama primero.')
    return
  }

  const validExercises = exercises.filter(e => e.name.trim())
  if (validExercises.length === 0) {
    alert('Agrega al menos un ejercicio con su nombre.')
    return
  }

  const profile = getProfile()
  if (!profile) return

  const btn = document.getElementById('analyzeBtn')
  btn.disabled = true

  try {
    showState('loading')


    setLoadingText('Analizando estructura de la rutina...')
    const prompt = buildAnalysisPrompt(profile, validExercises)
    const jsonResponse = await complete(prompt)

    let analysisData
    try {
      analysisData = parseJSON(jsonResponse)
    } catch (err) {
      console.error('JSON parse failed:', err, '\nRaw:', jsonResponse)
      
      showFallbackResults(jsonResponse)
      return
    }


    showState('results')
    renderResults(analysisData)


    setLoadingText('Generando análisis narrativo...')
    const streamBox = document.getElementById('streamBox')
    const streamText = document.getElementById('streamText')
    streamBox.classList.remove('hidden')
    streamText.textContent = ''

    const narrativePrompt = buildNarrativePrompt(profile, validExercises)
    await streamCompletion(narrativePrompt, (chunk) => {
      streamText.textContent += chunk
      streamText.scrollTop = streamText.scrollHeight
    })

  } catch (err) {
    console.error('Analysis failed:', err)
    showState('empty')
    alert(`Error al analizar: ${err.message}`)
  } finally {
    btn.disabled = false
  }
}

function getProfile() {
  const weight = parseFloat(document.getElementById('weight').value)
  const age = parseInt(document.getElementById('age').value)
  const height = parseFloat(document.getElementById('height').value)

  if (!weight || !age || !height) {
    alert('Completa tu peso, edad y altura para el análisis.')
    return null
  }

  return {
    weight,
    age,
    height,
    experience: document.getElementById('experience').value,
    goal: selectedGoal,
    days: selectedDays,
    injuries: document.getElementById('injuries').value.trim()
  }
}

function showFallbackResults(rawText) {
  showState('results')
  document.getElementById('scoreValue').textContent = '?'
  document.getElementById('scoreVerdict').textContent = 'ANÁLISIS GENERADO'

  const streamBox = document.getElementById('streamBox')
  const streamText = document.getElementById('streamText')
  streamBox.classList.remove('hidden')
  streamText.textContent = rawText

  document.getElementById('tabContent').innerHTML = `
    <div class="tab-pane active" id="pane-mejoras">
      <p style="color:var(--text-muted);padding:20px 0;font-size:13px;">
        El modelo no retornó JSON estructurado. Revisa el análisis completo abajo.
      </p>
    </div>
  `
}

init()
