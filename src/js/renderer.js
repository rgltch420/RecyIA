export function renderResults(data) {
  document.getElementById('scoreValue').textContent = data.score
  document.getElementById('scoreVerdict').textContent = data.verdict || '—'
  const scoreEl = document.getElementById('scoreCircle')
  if (data.score >= 8) {
    scoreEl.style.borderColor = 'var(--accent-3)'
    scoreEl.style.boxShadow = '0 0 20px rgba(6,255,165,0.3)'
    document.getElementById('scoreValue').style.color = 'var(--accent-3)'
  } else if (data.score >= 5) {
    scoreEl.style.borderColor = 'var(--accent-2)'
    scoreEl.style.boxShadow = '0 0 20px rgba(255,209,102,0.3)'
    document.getElementById('scoreValue').style.color = 'var(--accent-2)'
  } else {
    scoreEl.style.borderColor = 'var(--accent)'
    scoreEl.style.boxShadow = '0 0 20px var(--accent-glow)'
    document.getElementById('scoreValue').style.color = 'var(--accent)'
  }

  renderMejoras(data.mejoras || [])
  renderPesos(data.progresion_pesos || [])
  renderRutina(data.rutina_optimizada || [])
  renderTips(data.tips || [])
}

function renderMejoras(mejoras) {
  const container = document.createElement('div')
  container.className = 'tab-pane active'
  container.id = 'pane-mejoras'

  if (!mejoras.length) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:20px 0;font-size:13px;">No se encontraron mejoras específicas.</p>'
    setTabContent(container)
    return
  }

  mejoras.forEach(m => {
    const el = document.createElement('div')
    el.className = 'mejora-item'
    el.innerHTML = `
      <div class="mejora-badge">${m.emoji || '⚡'}</div>
      <div>
        <div class="mejora-title">${m.titulo || ''}</div>
        <div class="mejora-desc">${m.descripcion || ''}</div>
      </div>
    `
    container.appendChild(el)
  })

  setTabContent(container)
}

function renderPesos(pesos) {
  const container = document.createElement('div')
  container.className = 'tab-pane'
  container.id = 'pane-pesos'

  if (!pesos.length) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:20px 0;font-size:13px;">Agrega ejercicios con pesos para ver la progresión.</p>'
    setTabContent(container, true)
    return
  }

  const table = document.createElement('table')
  table.className = 'weight-table'
  table.innerHTML = `
    <thead>
      <tr>
        <th>Ejercicio</th>
        <th>Actual</th>
        <th></th>
        <th>Siguiente</th>
        <th>En</th>
        <th>Razón</th>
      </tr>
    </thead>
    <tbody>
      ${pesos.map(p => `
        <tr>
          <td class="weight-current">${p.ejercicio}</td>
          <td class="weight-current">${p.peso_actual}kg</td>
          <td class="weight-arrow">→</td>
          <td class="weight-next">${p.peso_siguiente}kg</td>
          <td style="color:var(--text-muted)">${p.semanas || '?'}sem</td>
          <td style="color:var(--text-muted);font-size:11px">${p.razon || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  `

  container.appendChild(table)
  setTabContent(container, true)
}

function renderRutina(dias) {
  const container = document.createElement('div')
  container.className = 'tab-pane'
  container.id = 'pane-rutina'

  if (!dias.length) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:20px 0;font-size:13px;">No se generó rutina optimizada.</p>'
    setTabContent(container, true)
    return
  }

  dias.forEach(d => {
    const dayEl = document.createElement('div')
    dayEl.className = 'routine-day'
    dayEl.innerHTML = `
      <div class="routine-day-header">${d.dia}</div>
      ${(d.ejercicios || []).map(e => `
        <div class="routine-exercise">
          <span class="routine-ex-name">${e.nombre}</span>
          <span class="routine-ex-sets">${e.series} · ${e.descanso || ''}</span>
        </div>
      `).join('')}
    `
    container.appendChild(dayEl)
  })

  setTabContent(container, true)
}

function renderTips(tips) {
  const container = document.createElement('div')
  container.className = 'tab-pane'
  container.id = 'pane-tips'

  if (!tips.length) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:20px 0;font-size:13px;">No se generaron tips.</p>'
    setTabContent(container, true)
    return
  }

  tips.forEach(t => {
    const el = document.createElement('div')
    el.className = 'tip-item'
    el.innerHTML = `<div class="tip-title">${t.titulo || 'Tip'}</div>${t.consejo || ''}`
    container.appendChild(el)
  })

  setTabContent(container, true)
}

function setTabContent(el, append = false) {
  const container = document.getElementById('tabContent')
  if (!append) container.innerHTML = ''
  container.appendChild(el)
}

export function parseJSON(text) {
  // 1. Strip markdown fences
  let clean = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()

  // 2. Extract the outermost { ... } block
  const start = clean.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in response')
  clean = clean.substring(start)

  // 3. Walk chars to find the matching closing brace (handles truncation)
  let depth = 0
  let end = -1
  let inString = false
  let escape = false

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  if (end !== -1) {
    clean = clean.substring(0, end + 1)
  }
 
  clean = clean.replace(/,\s*\n\s*"nombre\d+:/g, ', "nombre:')


  try {
    return JSON.parse(clean)
  } catch (firstErr) {

    const attempts = [
  
      () => tryClose(clean, '}]}]}'),
      () => tryClose(clean, ']}]}'),
      () => tryClose(clean, '}]}'),
      () => tryClose(clean, ']}'),
      () => tryClose(clean, '}'),
    ]

    for (const attempt of attempts) {
      try {
        const result = attempt()
        if (result) return result
      } catch {}
    }

    return extractPartialData(clean)
  }
}

function tryClose(text, suffix) {

  const truncated = truncateAtLastGoodBrace(text)
  if (!truncated) return null
  const candidate = truncated + suffix
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function truncateAtLastGoodBrace(text) {
  
  const goodEndings = [
    /("razon"\s*:\s*"[^"]*"\s*\})/g,
    /("consejo"\s*:\s*"[^"]*"\s*\})/g,
    /("descripcion"\s*:\s*"[^"]*"\s*\})/g,
    /("descanso"\s*:\s*"[^"]*"\s*\})/g,
  ]

  let lastGoodPos = -1
  for (const re of goodEndings) {
    let m
    re.lastIndex = 0
    while ((m = re.exec(text)) !== null) {
      lastGoodPos = Math.max(lastGoodPos, m.index + m[0].length)
    }
  }

  if (lastGoodPos === -1) return null
  return text.substring(0, lastGoodPos)
}

function extractPartialData(text) {
  const score = text.match(/"score"\s*:\s*(\d+)/)
  const verdict = text.match(/"verdict"\s*:\s*"([^"]*)"/)
  const mejoras = []
  const mejoraRe = /"emoji"\s*:\s*"([^"]*)"\s*,\s*"titulo"\s*:\s*"([^"]*)"\s*,\s*"descripcion"\s*:\s*"([^"]*)"/g
  let m
  while ((m = mejoraRe.exec(text)) !== null) {
    mejoras.push({ emoji: m[1], titulo: m[2], descripcion: m[3] })
  }
  const pesos = []
  const pesoRe = /"ejercicio"\s*:\s*"([^"]*)"\s*,\s*"peso_actual"\s*:\s*(\d+)\s*,\s*"peso_siguiente"\s*:\s*(\d+)\s*,\s*"razon"\s*:\s*"([^"]*)"/g
  while ((m = pesoRe.exec(text)) !== null) {
    pesos.push({ ejercicio: m[1], peso_actual: +m[2], peso_siguiente: +m[3], razon: m[4] })
  }

  return {
    score: score ? +score[1] : 5,
    verdict: verdict ? verdict[1] : 'ANÁLISIS PARCIAL',
    mejoras,
    progresion_pesos: pesos,
    rutina_optimizada: [],
    tips: [{ titulo: 'Nota', consejo: 'El modelo generó una respuesta incompleta. Los datos principales fueron recuperados.' }]
  }
}

export function showState(state) {
  document.getElementById('emptyState').classList.add('hidden')
  document.getElementById('loadingState').classList.add('hidden')
  document.getElementById('results').classList.add('hidden')

  if (state === 'loading') document.getElementById('loadingState').classList.remove('hidden')
  else if (state === 'results') document.getElementById('results').classList.remove('hidden')
  else document.getElementById('emptyState').classList.remove('hidden')
}

export function setLoadingText(text) {
  document.getElementById('loadingText').textContent = text
}