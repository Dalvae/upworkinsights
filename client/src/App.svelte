<script lang="ts">
  import Router from 'svelte-spa-router';
  import Nav from './components/Nav.svelte';
  import { routes } from './router';
</script>

<Nav />
<main class="container py-8">
  <Router {routes} />
</main>
