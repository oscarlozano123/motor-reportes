<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const router = useRouter()

const modoRegistro = ref(false)
const form = reactive({ nombre: '', email: '', password: '' })
const error = ref('')
const enviando = ref(false)

async function enviar() {
  error.value = ''
  enviando.value = true
  try {
    if (modoRegistro.value) await auth.crearCuenta(form.nombre, form.email, form.password)
    else await auth.ingresar(form.email, form.password)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudo conectar con el backend.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section class="panel panel-login">
    <h2>{{ modoRegistro ? 'Crear cuenta' : 'Iniciar sesión' }}</h2>
    <p class="nota">Cada usuario ve únicamente sus propios reportes.</p>

    <form @submit.prevent="enviar">
      <label v-if="modoRegistro">
        Nombre
        <input v-model="form.nombre" type="text" autocomplete="name" required />
      </label>
      <label>
        Correo
        <input v-model="form.email" type="email" autocomplete="email" required />
      </label>
      <label>
        Clave {{ modoRegistro ? '(mínimo 6 caracteres)' : '' }}
        <input
          v-model="form.password"
          type="password"
          minlength="6"
          :autocomplete="modoRegistro ? 'new-password' : 'current-password'"
          required
        />
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit" :disabled="enviando">
        {{ enviando ? 'Enviando...' : modoRegistro ? 'Crear cuenta' : 'Entrar' }}
      </button>
    </form>

    <p class="cambiar-modo">
      {{ modoRegistro ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?' }}
      <a href="#" @click.prevent="modoRegistro = !modoRegistro; error = ''">
        {{ modoRegistro ? 'Inicia sesión' : 'Regístrate' }}
      </a>
    </p>
  </section>
</template>
