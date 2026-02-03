<script lang="ts">
  let { message = 'Loading...' }: { message?: string } = $props();
</script>

<div class="text-center text-gray-500 py-12">{message}</div>
