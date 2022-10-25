<script lang="ts">
	import { store } from '$lib/store';
	import { goto } from '$app/navigation';
	import Button, { Label } from '@smui/button';
	import Cube from '$lib/components/Cube.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import IconButton from '@smui/icon-button';
	import { Item, Text } from '@smui/list';
	import { get_roux_stages, type SolutionDesc } from '$lib/third_party/onionhoney/Analyzer';
	import { MoveSeq } from '$lib/third_party/onionhoney/CubeLib';
	import { makeOptimizedData } from '$lib/optimizer/optimizer';
	import { analyzeSolve } from '$lib/components/MethodReconstruction';

	function toArray(any: ArrayLike<unknown> | Iterable<unknown>) {
		if (any) return Array.from(any);
		return [];
	}
	export let solveId: string = '';
	export let methodId: string | undefined = undefined;
	export let displayMode = 'times';

	$: solve = solveId ? $store.solves.solveIdToSolve[solveId] : undefined;
	$: time = solve && solve.time / 10;
	$: moveCount = solve ? solve.moves.filter((x) => x.timestamp > 0).length + 1 : 0;
	$: offset = solve?.numMovesToScramble;
	$: scrambleArray = solve ? toArray(solve.moves.map((x) => x.move)).slice(0, offset) : [];
	$: scrambleString = scrambleArray.join(' ');
	$: timestamps = solve ? solve.moves.map((x) => x.timestamp) : [];
	$: solutionString = solve
		? toArray(solve.moves.map((x) => x.move))
				.slice(scrambleArray.length)
				.join(' ')
		: '';

	$: cubeSS = scrambleString;
	let alternateScramble = scrambleString;

	function getStages(scramble: string, solution: string) {
		if (methodId) {
			console.log('Get stages, via method: ', methodId);
			return analyzeSolve(methodId, scramble, solution);
		}
		return get_roux_stages(scramble, solution);
	}

	$: stages = getStages(scrambleString, solutionString);
	$: edges = stages.map((s, i) =>
		i === 0 ? edgeFrom('scrambled', s.stage) : edgeFrom(stages[i - 1].stage, s.stage)
	);
	$: cubeAlg = makeText(stages);
	$: optimized = makeOptimizedData(scrambleString, stages) as {
		orientation?: string;
		stage: string;
		solution: MoveSeq;
		score: number;
	}[][];
	let alternateSolution: SolutionDesc | undefined = undefined;
	$: console.log({ stages, optimized });

	function translate(key: string) {
		return translation[key] || key;
	}
	function edgeFrom(s0: string, s1: string) {
		return s0 + '→' + s1;
	}
	const translation: { [k: string]: string } = {
		fb: 'First block',
		ss: 'Square',
		sp: 'Last pair',
		cmll: 'CMLL',
		lse: 'LSE'
	};

	const headings: { [k: string]: string } = {
		moves: 'Moves by stage',
		times: 'Times by stage'
	};
	const yAxisLabels: { [k: string]: string } = {
		moves: ' moves',
		times: ' seconds'
	};
	$: stageKeys = Object.keys(stages);
	type DataPoint = { xValue: any; yValue: number };
	$: solveData = [] as DataPoint[];
	const timings: { [k: string]: number } = {};
	function makeDataTable(displayMode: string) {
		solveData = [];
		let startTimeOffset = scrambleArray.length;
		stages.forEach((s, i) => {
			let endOffset = startTimeOffset + s.solution.length();
			let yValue = s.solution.length();
			if (endOffset > 0 && startTimeOffset > 0) {
				const timing =
					Math.round((timestamps[endOffset - 1] - timestamps[startTimeOffset - 1]) / 100) / 10;
				timings[s.stage] = timing;
				if (displayMode === 'times') {
					yValue = timing;
				}
			}
			const xValue = translate(edges[i]);
			let data: DataPoint = { xValue, yValue };
			solveData.push(data);
			startTimeOffset = endOffset;
		});
		console.log({ stages, solveData });
		//console.log(JSON.stringify(stages));
	}
	$: if (solve) {
		makeDataTable(displayMode);
	}
	$: maxY = solveData
		.map((e) => e.yValue)
		.sort((a, b) => Number(a) - Number(b))
		.slice(-1)[0];
	$: numTicks = Math.trunc(maxY / 5);
	$: yTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].slice(0, numTicks + 2);
	$: if (yTicks) {
		let tmaxY = solveData.map((e) => e.yValue).sort((a, b) => Number(a) - Number(b));
		console.log({ yTicks, maxY, numTicks, tmaxY });
	}
	$: heading = headings[displayMode];
	$: axisLabel = yAxisLabels[displayMode];

	function toggleDisplayMode() {
		displayMode = displayMode === 'times' ? 'moves' : 'times';
	}
	function makeText(stages: SolutionDesc[]) {
		let algStr = `// Scramble: ${scrambleString}\n`;
		let orientation = new MoveSeq([]);
		let prerotate = new MoveSeq([]);
		if (stages[0].view) {
			prerotate = stages[0].view;
		}
		if (stages[0].orientation) {
			orientation = new MoveSeq(stages[0].orientation);
		}
		algStr += orientation + ' ' + prerotate.inv() + ' ';
		stages.forEach((s, i) => {
			let quicker = '?';
			algStr += s.rotatedSolution + ' // ' + translate(edges[i]);
			if (optimized && optimized[i] && optimized[i].length) {
				const spin = new MoveSeq(optimized[i][0]?.orientation || '');
				const moves = new MoveSeq(optimized[i][0].solution.moves);
				quicker = spin + ' ' + moves;
				algStr +=
					`(${s.solution.length()}) vs (${spin.moves.length + moves.moves.length}) ` + quicker;
			}
			algStr += '\n';
		});
		return algStr;
	}

	function copyText() {
		const algStr = makeText(stages);
		navigator.clipboard.writeText(algStr);
		selectStage('solved');
	}

	function bugText() {
		let text = `// Bug Report: incorrect solve reconstruction.
validateUserSolution({
	scramble: "${scrambleString}",
  original_solution: "${solutionString}",
	orientation: "${new MoveSeq(stages[0].orientation || [])}",
	fb: "${stages[0]?.view?.inv() || ''} ${stages[0].rotatedSolution}", 
	ss: "${stages[1].rotatedSolution}",
	lp: "${stages[2].rotatedSolution}",
	cmll: "${stages[3].rotatedSolution}",
	lse: "${stages[4].rotatedSolution}"
});
`;
		navigator.clipboard.writeText(text);
		// Bug Report: incorrect solve reconstruction.
	}

	function handleStage(stageSelected: any) {
		selectStage(stageSelected.detail);
	}
	let startOffset = 0;
	let endOffset = -1;
	let nextStage: string | undefined = undefined;
	function selectStage(stageSelected: string) {
		startOffset = 0;
		endOffset = -1;
		nextStage = undefined;
		if (stages[0].view) {
			startOffset += stages[0].view.length();
		}
		if (stages[0].orientation) {
			startOffset += new MoveSeq(stages[0].orientation).length();
		}
		playHead = -1;
		alternateSolution = undefined;
		alternateScramble = scrambleString;
		cubeSS = scrambleString;
		cubeAlg = makeText(stages);
		console.log('SHOW: ', stageSelected, ' scramble offset ', startOffset);
		stages.forEach((s, i) => {
			if (s.stage === stageSelected || edges[i] === stageSelected) {
				console.log('SHOW POSITION: ', startOffset, ' for ', stageSelected);
				playHead = startOffset;
				if (s.stageId) {
					stickering = i > 0 ? stages[i - 1].stageId || '' : 'scrambled';
					stickering += '|' + s.stageId;
				} else {
					stickering = s.stage;
				}
				if (stages[0].orientation) {
					stickeringOrientation = new MoveSeq(stages[0].orientation).inv().toString();
				}
				if (optimized[i] && optimized[i].length) {
					alternateSolution = { ...optimized[i][0], rotatedSolution: new MoveSeq([]) };
					alternateSolution.stage = s.stage;
				} else {
					alternateSolution = undefined;
				}
			} else if (alternateSolution === undefined) {
				if (i === 0 && s.orientation) alternateScramble += ' ' + new MoveSeq(s.orientation) + ' ';
				if (s.view) {
					alternateScramble += ' ' + s.view.inv() + ' ';
				}
				alternateScramble += ' ' + s.rotatedSolution + ' ';
			}
			if (endOffset === -1) {
				startOffset += s.rotatedSolution.length();
			} else if (nextStage === undefined) {
				nextStage = s.stage;
			}
			if (s.stage === stageSelected || edges[i] === stageSelected) {
				endOffset = startOffset;
			}
		});
		if (playHead === -1) {
			playHead = startOffset;
			stickering = '';
		}
	}
	function playAlternate() {
		cubeSS = alternateScramble;
		const spin = new MoveSeq(alternateSolution?.orientation || '');
		cubeAlg = spin + ' ' + alternateSolution?.solution;
		playHead = 0;
		console.log({ cubeSS, cubeAlg, playHead });
	}
	let playHead = 0;
	let stickering = '';
	let stickeringOrientation = '';
	$: if (playHead === endOffset) {
		if (nextStage) {
			selectStage(nextStage);
		}
	}
</script>

<div class="container">
	{#if solve}
		{#if displayMode !== 'moves'}
			<h1 on:click={toggleDisplayMode}>Time: {time}s</h1>
		{:else}
			<h1 on:click={toggleDisplayMode}>Move Count: {moveCount}</h1>
		{/if}
		<BarChart
			on:message={handleStage}
			points={solveData}
			xTicks={stageKeys}
			{yTicks}
			{heading}
			{axisLabel}
		/>
		<p style="display:inline-block">
			<Item>
				<IconButton class="material-icons" on:click={copyText}>content_copy</IconButton>
				<Text on:click={copyText}>Scramble: {scrambleString}</Text>
				<IconButton class="material-icons" on:click={bugText}>bug_report</IconButton>
			</Item>
		</p>
		<table cellspacing="0" align="center">
			<tr><td align="left">Stage</td><td>Length</td><td>Time</td><td align="left">Solution</td></tr>
			{#each stages as stage, i}
				<tr class={i % 2 ? 'odd' : 'even'} on:click={() => selectStage(stage.stage)}>
					<td align="left">{translate(edges[i])}</td><td>{stage.solution.length()}</td>
					<td>{timings[stage.stage]}</td><td align="left">{stage.rotatedSolution}</td>
				</tr>
				{#if alternateSolution && alternateSolution.stage === stage.stage && alternateSolution.solution.length() > 0}
					<tr class={'alternate'} on:click={() => playAlternate()}>
						<td align="left"><em>vs: </em>{translate(edges[i])}</td><td
							>{alternateSolution.solution.length()}</td
						>
						<td
							>{Math.round(
								timings[stage.stage] *
									(alternateSolution.solution.length() / stage.solution.length())
							)}</td
						><td align="left">{alternateSolution.solution}</td>
					</tr>
				{/if}
			{/each}
		</table>
		<Cube
			bind:playHead
			{stickering}
			{stickeringOrientation}
			scramble={cubeSS}
			solve={cubeAlg}
			controlPanel={'yes'}
		/>
	{:else}
		<h1>Loading...</h1>
	{/if}
</div>

<style>
	h1 {
		text-align: center;
		border-bottom: 1px solid grey;
	}

	tr:hover td {
		background-color: #ffffa0;
	}
	tr:hover:first-child td {
		background-color: transparent;
	}
	.container {
		text-align: center;
		width: 100%;
		font-family: 'Roboto', sans-serif;
	}

	td {
		border-bottom: 1px solid #ddd;
		padding: 0.5em;
		padding-top: 0.1em;
		padding-bottom: 0.1em;
	}
	.odd td {
		background-color: #f0f0f0;
	}

	.alternate td {
		font-weight: bold;
		background-color: #a0d0a0;
	}

	table {
		padding-bottom: 3em;
	}
	p {
		padding: 0.3em;
	}
</style>
