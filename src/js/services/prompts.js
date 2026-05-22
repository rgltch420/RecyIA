export function buildAnalysisPrompt(profile, exercises) {
  const exerciseList = exercises
    .map(e => `- ${e.name}: ${e.weight}kg x ${e.sets}x${e.reps}`)
    .join('\n')

  const imc = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)

  const pesosSkeleton = exercises
    .map(e => `    {"ejercicio":"${e.name}","peso_actual":${e.weight},"peso_siguiente":NUMERO,"razon":"TEXTO","semanas":NUMERO}`)
    .join(',\n')

  const diasSkeleton = Array.from({ length: profile.days }, (_, i) =>
    `    {"dia":"DIA ${i + 1}","ejercicios":[{"nombre":"EJERCICIO","series":"NxN","descanso":"Nmin"}]}`
  ).join(',\n')

  return `You are a strength coach. Output ONLY raw JSON. No markdown. No explanation. No extra text before or after. Do not write anything except the JSON object.

Athlete: weight=${profile.weight}kg height=${profile.height}cm age=${profile.age} IMC=${imc} experience=${profile.experience} goal=${profile.goal} days=${profile.days} injuries=${profile.injuries || 'none'}

Exercises:
${exerciseList}

Fill in this exact JSON structure. Replace every NUMERO with a number and every TEXTO with a short string in Spanish. Do not add any fields. Do not write any text outside the JSON.

{"score":NUMERO,"verdict":"TEXTO EN MAYUSCULAS","mejoras":[{"emoji":"EMOJI","titulo":"TEXTO","descripcion":"TEXTO"},{"emoji":"EMOJI","titulo":"TEXTO","descripcion":"TEXTO"},{"emoji":"EMOJI","titulo":"TEXTO","descripcion":"TEXTO"}],"progresion_pesos":[
${pesosSkeleton}
],"rutina_optimizada":[
${diasSkeleton}
],"tips":[{"titulo":"TEXTO","consejo":"TEXTO"},{"titulo":"TEXTO","consejo":"TEXTO"}]}

Rules for filling:
- score: integer 1-10
- verdict: 2-4 words uppercase Spanish
- peso_siguiente: apply progressive overload (+2.5 to 5kg legs, +1.25 to 2.5kg arms)
- semanas: integer weeks until next progression
- Consider injuries: ${profile.injuries || 'none'}
- Goal is ${profile.goal}
- Output ONLY the JSON. Stop immediately after the closing brace.`
}


export function buildNarrativePrompt(profile, exercises) {
  const exerciseList = exercises
    .map(e => `• ${e.name}: ${e.weight}kg × ${e.sets} series × ${e.reps} reps`)
    .join('\n')

  return `Eres un entrenador personal experto. Da un análisis narrativo breve y directo (máximo 200 palabras) de esta rutina. Sé específico, usa bullet points, sé directo como un coach real. No seas genérico.

Atleta: ${profile.age} años, ${profile.weight}kg, ${profile.experience}, objetivo ${profile.goal}, ${profile.days} días/semana${profile.injuries ? `, lesión: ${profile.injuries}` : ''}.

Ejercicios:
${exerciseList}

Análisis:`
}