<script lang="ts">
  import Router from 'svelte-spa-router';
  import { Tooltip } from "bits-ui";
  import Nav from './components/Nav.svelte';
  import { routes } from './router';
</script>

<Tooltip.Provider delayDuration={300}>
  <Nav />
  <main class="container py-8">
    <Router {routes} />
  </main>
</Tooltip.Provider>
