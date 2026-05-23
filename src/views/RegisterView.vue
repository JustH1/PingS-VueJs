<script setup>
import RegisterForm from '@/components/auth/RegisterForm.vue'
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-card__logo">
        <span class="auth-card__logo-icon">💬</span>
        <h1 class="auth-card__title">PingS</h1>
        <p class="auth-card__subtitle">Create a new account</p>
      </div>

      <RegisterForm />

      <p class="auth-card__footer">
        Already have an account?
        <RouterLink to="/login">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-primary);
  padding: var(--space-xl);
  overflow-y: auto;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.auth-card__logo {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.auth-card__logo-icon {
  font-size: 48px;
  line-height: 1;
}

.auth-card__title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.5px;
}

.auth-card__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.auth-card__footer {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
