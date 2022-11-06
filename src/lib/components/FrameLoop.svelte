<script lang="ts">
	import { BoxGeometry, MeshStandardMaterial } from 'three';
	import { DirectionalLight, Mesh, useFrame } from '@threlte/core';

	let rotation = 0;
	useFrame(() => {
		rotation += 0.01;
	});
</script>
