<template>
  <div class="container">
    <div class="not-found card">
      <div class="nf-code">404</div>
      <h1>Page Not Found</h1>
      <p class="text-muted mt-2">The page you're looking for doesn't exist or has been moved.</p>
      <div class="mt-6 flex gap-4 justify-center">
        <router-link to="/" class="btn btn-primary">Go to Home</router-link>
        <router-link to="/admin/dashboard" class="btn btn-secondary">Admin Dashboard</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  max-width: 480px;
  margin: 4rem auto;
  padding: 3rem;
}
.nf-code {
  font-size: 5rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: 0.5rem;
}
</style>
