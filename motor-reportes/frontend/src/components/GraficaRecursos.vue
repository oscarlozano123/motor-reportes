<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { historialRecursos, consultarRecursos } from '../services/api'

const lecturas = ref([])
const umbrales = ref({ cpu: null, ram: null })
const error = ref(false)
let temporizador = null

// Área de dibujo del SVG (el eje Y va de 0 a 100 %)
const ANCHO = 600
const ALTO = 180
const MARGEN = 8

async function cargar() {
  try {
    lecturas.value = await historialRecursos()
    if (umbrales.value.cpu === null) {
      const actual = await consultarRecursos()
      umbrales.value = { cpu: actual.umbralCpu, ram: actual.umbralRam }
    }
    error.value = false
  } catch {
    error.value = true
  }
}

function y(pct) {
  return ALTO - MARGEN - (Math.min(100, Math.max(0, pct)) / 100) * (ALTO - 2 * MARGEN)
}

function puntos(campo) {
  const n = lecturas.value.length
  if (n < 2) return ''
  return lecturas.value
    .map((l, i) => {
      const x = MARGEN + (i / (n - 1)) * (ANCHO - 2 * MARGEN)
      return `${x.toFixed(1)},${y(l[campo]).toFixed(1)}`
    })
    .join(' ')
}

const puntosCpu = computed(() => puntos('cpuPct'))
const puntosRam = computed(() => puntos('ramPct'))

onMounted(() => {
  cargar()
  temporizador = setInterval(cargar, 3000)
})
onBeforeUnmount(() => clearInterval(temporizador))
</script>

<template>
  <div>
    <p v-if="error" class="error">No se pudo conectar con el backend.</p>
    <p v-else-if="lecturas.length < 2" class="nota">Reuniendo lecturas...</p>

    <svg v-else class="grafica" :viewBox="`0 0 ${ANCHO} ${ALTO}`" role="img"
         aria-label="Uso de CPU y RAM de los últimos minutos">
      <line v-for="p in [0, 25, 50, 75, 100]" :key="p"
            :x1="MARGEN" :x2="ANCHO - MARGEN" :y1="y(p)" :y2="y(p)" class="grafica-guia" />
      <line v-if="umbrales.cpu" :x1="MARGEN" :x2="ANCHO - MARGEN"
            :y1="y(umbrales.cpu)" :y2="y(umbrales.cpu)" class="grafica-umbral" />
      <polyline :points="puntosRam" class="linea-ram" />
      <polyline :points="puntosCpu" class="linea-cpu" />
    </svg>

    <div class="leyenda">
      <span class="leyenda-cpu">CPU</span>
      <span class="leyenda-ram">RAM</span>
      <span v-if="umbrales.cpu">Línea punteada: umbral ({{ umbrales.cpu }}%)</span>
    </div>
    <small>Últimos 3 minutos, una lectura cada 3 segundos. Eje: 0 a 100 %.</small>
  </div>
</template>
