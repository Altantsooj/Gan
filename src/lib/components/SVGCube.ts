/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { puzzles, type PuzzleLoader } from 'cubing/puzzles';

interface Piece {
	[orientation: number]: Facelet;
}

export type ClickCallback = (id: Facelet) => void;

export class Cube {
	pieces = new Map<string, { [position: number]: Piece }>();

	puzzle: PuzzleLoader;
	clickHandler: ClickCallback;

	constructor(clickHandler: ClickCallback) {
		this.clickHandler = clickHandler;
		this.puzzle = puzzles['3x3x3'];
	}

	puzzlePromise: Promise<void> | undefined = undefined;
	async loadPuzzle() {
		if (this.puzzlePromise === undefined) {
			this.puzzlePromise = this.puzzle.svg().then((svg) => {
				document.querySelector('#puzzle')!.innerHTML = svg;
				document.querySelector('svg')!.removeAttribute('width');
				document.querySelector('svg')!.removeAttribute('height');

				this.displayCube();
			});
		}
		return this.puzzlePromise;
	}

	getFaceletByOrbit(orbit: string, index: number): Facelet {
		return this.pieces.get(orbit)![index][0];
	}

	displayCube = async () => {
		const { orbits } = (await this.puzzle.kpuzzle()).definition;

		for (const orbitName in orbits) {
			const orbitVal = orbits[orbitName];

			for (let orientation = 0; orientation < orbitVal.numOrientations; orientation++) {
				for (let piece = 0; piece < orbitVal.numPieces; piece++) {
					const facelet = new Facelet(orbitName, piece, orientation, this.clickHandler);
					if (!this.pieces.get(orbitName)) {
						this.pieces.set(orbitName, {});
					}
					this.pieces.get(orbitName)![piece] = {
						...this.pieces.get(orbitName)![piece],
						[orientation]: facelet
					};
				}
			}
		}
	};

	getFaceletByOrientation(piece: Piece, orientation: number) {
		return piece[orientation];
	}

	getPieceByFacelet({ position, type }: Facelet) {
		return this.pieces.get(type)![position];
	}

	swapFacelets(facelet1: Facelet, facelet2: Facelet) {
		const temp = facelet1.element.style.fill;
		facelet1.element.style.fill = facelet2.element.style.fill;
		facelet2.element.style.fill = temp;
	}

	async setState(state: number, facelet: Facelet) {
		const piece = this.getPieceByFacelet(facelet);

		const { orbits } = (await this.puzzle.kpuzzle()).definition;

		const { numOrientations } = orbits[facelet.type];

		for (let i = 0; i < numOrientations; i++) {
			const facelet = this.getFaceletByOrientation(piece, i);
			facelet.element.style.fill = facelet.originalFill;
		}
		switch (state) {
			case 0x00:
				// ignore facelet
				for (let i = 0; i < numOrientations; i++) {
					const facelet = this.getFaceletByOrientation(piece, i);
					facelet.element.style.fill = 'darkgrey';
				}
				break;
			case 0x01:
				// oriented, but not positioned
				for (let i = 0; i < numOrientations; i++) {
					const facelet = this.getFaceletByOrientation(piece, i);
					facelet.element.style.fill = i === 0 ? 'pink' : 'lightgrey';
				}
				break;
			case 0x02:
				// positioned, but not oriented
				for (let i = 0; i < numOrientations - 1; i++) {
					const facelet = this.getFaceletByOrientation(piece, i);
					const facelet2Orientation = (numOrientations + facelet.orientation + 1) % numOrientations;
					this.swapFacelets(facelet, this.getFaceletByOrientation(piece, facelet2Orientation));
				}
				break;
			default:
			case 0x03:
				break;
		}
	}

	async twist(facelet: Facelet) {
		const piece = this.getPieceByFacelet(facelet);

		const { orbits } = (await this.puzzle.kpuzzle()).definition;

		const { numOrientations } = orbits[facelet.type];

		for (let i = 0; i < numOrientations - 1; i++) {
			const facelet = this.getFaceletByOrientation(piece, i);
			const facelet2Orientation = (numOrientations + facelet.orientation + 1) % numOrientations;
			this.swapFacelets(facelet, this.getFaceletByOrientation(piece, facelet2Orientation));
		}
	}

	async swap(facelet1: Facelet, facelet2: Facelet) {
		const piece1 = this.getPieceByFacelet(facelet1);
		const piece2 = this.getPieceByFacelet(facelet2);

		if (piece1 === piece2) {
			return;
		}

		const offset = facelet2.orientation - facelet1.orientation;

		const { orbits } = (await this.puzzle.kpuzzle()).definition;

		const { numOrientations } = orbits[facelet1.type];

		for (let i = 0; i < numOrientations; i++) {
			const facelet = this.getFaceletByOrientation(piece1, i);

			const facelet2Orientation =
				(numOrientations + facelet.orientation + offset) % numOrientations;
			this.swapFacelets(facelet, this.getFaceletByOrientation(piece2, facelet2Orientation));
		}
	}
}

export class Facelet {
	type: string;
	position: number;
	orientation: number;
	element: HTMLOrSVGImageElement;
	originalFill: string;

	constructor(type: string, position: number, orientation: number, clickHandler: ClickCallback) {
		this.type = type;
		this.orientation = orientation;
		this.position = position;
		this.element = document.getElementById(this.getId())! as HTMLOrSVGImageElement;
		this.element.onclick = () => clickHandler(this);
		this.originalFill = this.element.style.fill;
	}

	getId() {
		return `${this.type}-l${this.position}-o${this.orientation}`;
	}
}
