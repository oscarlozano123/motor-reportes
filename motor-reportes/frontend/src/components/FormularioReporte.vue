<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { categoriasVentas, resumenVentas } from '../services/api'

defineProps({ enviando: Boolean })
const emit = defineEmits(['enviar'])

const form = reactive({
  tipo: 'pdf',
  titulo: '',
  filas: 500,
  prioridad: 'normal',
  fuente: 'ventas',
  desde: '',
  hasta: '',
  categoria: ''
})

const categorias = ref([])
const resumen = ref(null)
const errorResumen = ref('')
let espera = null

onMounted(async () => {
  try {
    categorias.value = await categoriasVentas()
  } catch {
    categorias.value = []
  }
  calcularResumen()
})

// Muestra cuántas ventas y qué total tendría el reporte con los filtros elegidos
async function calcularResumen() {
  if (form.fuente !== 'ventas') return
  errorResumen.value = ''
  try {
    resumen.value = await resumenVentas({
      desde: form.desde,
      hasta: form.hasta,
      categoria: form.categoria
    })
  } catch (e) {
    resumen.value = null
    errorResumen.value = e.response?.data?.error || ''
  }
}

watch(() => [form.fuente, form.desde, form.hasta, form.categoria], () => {
  clearTimeout(espera)
  espera = setTimeout(calcularResumen, 300)
})

function enviar() {
  const datos = {
    tipo: form.tipo,
    titulo: form.titulo,
    prioridad: form.prioridad,
    fuente: form.fuente
  }
  if (form.fuente === 'ventas') {
    datos.filtros = {
      desde: form.desde || undefined,
      hasta: form.hasta || undefined,
      categoria: form.categoria || undefined
    }
  } else {
    datos.filas = Number(form.filas)
  }
  emit('enviar', datos)
}

const dinero = (n) => `$${Number(n).toLocaleString('es-CO')}`
</script>

<template>
  <form @submit.prevent="enviar">
    <label>
      Tipo de reporte
      <select v-model="form.tipo" required>
        <option value="pdf">PDF</option>
        <option value="excel">Excel</option>
      </select>
    </label>

    <label>
      Título
      <input v-model="form.titulo" type="text" placeholder="Reporte de ventas" required />
    </label>

    <label>
      Datos del reporte
      <select v-model="form.fuente">
        <option value="ventas">Ventas reales (tabla de la base de datos)</option>
        <option value="simulado">Datos simulados (para probar el rendimiento)</option>
      </select>
    </label>

    <template v-if="form.fuente === 'ventas'">
      <div class="fila-campos">
        <label>
          Desde
          <input v-model="form.desde" type="date" />
        </label>
        <label>
          Hasta
          <input v-model="form.hasta" type="date" />
        </label>
        <label>
          Categoría
          <select v-model="form.categoria">
            <option value="">Todas</option>
            <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
      </div>

      <p v-if="resumen" class="resumen-filtro">
        Este filtro incluye <strong>{{ resumen.filas }}</strong> ventas por un total de
        <strong>{{ dinero(resumen.total) }}</strong>.
        <span v-if="resumen.filas === 0" class="aviso"> No hay datos para ese rango.</span>
      </p>
      <p v-else-if="errorResumen" class="error">{{ errorResumen }}</p>
    </template>

    <label v-else>
      Cantidad de filas (simula un reporte denso)
      <input v-model="form.filas" type="number" min="1" max="20000" required />
    </label>

    <label>
      Prioridad (el worker atiende primero las altas)
      <select v-model="form.prioridad">
        <option value="baja">Baja</option>
        <option value="normal">Normal</option>
        <option value="alta">Alta</option>
      </select>
    </label>

    <button type="submit" :disabled="enviando">
      {{ enviando ? 'Enviando...' : 'Generar reporte' }}
    </button>
  </form>
</template>
