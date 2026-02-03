<script lang="ts">
  let { label, value }: { label: string; value: string } = $props();
</script>

<div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
  <div class="text-gray-400 text-sm">{label}</div>
  <div class="text-3xl font-bold mt-1">{value}</div>
</div>
