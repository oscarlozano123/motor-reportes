<script setup>
// Layout: estructura común de todas las vistas (encabezado + contenido)
</script>

<template>
  <header class="encabezado">
    <h1>Motor de Reportes Asíncronos</h1>
    <nav class="menu">
      <router-link to="/">Generar reporte</router-link>
      <router-link to="/recursos">Recursos del servidor</router-link>
    </nav>
  </header>

  <main class="contenido">
    <slot />
  </main>
</template>
