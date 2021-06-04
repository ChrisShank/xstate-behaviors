import {
	AmbientLight,
	Mesh,
	MeshPhongMaterial,
	PerspectiveCamera,
	PointLight,
	Scene,
	TorusBufferGeometry,
	WebGLRenderer,
} from 'three';
import { AnyEventObject, createMachine, EventObject, InvokeCallback } from 'xstate';

function renderCanvas() {
	const colors = [0xe06c9f, 0xf283b6, 0xedbfb7, 0xb5bfa1, 0x6e9887],
		num = 15,
		meshArr: any[] = [];

	//LIL HELPER
	const totesRando = (min: number, max: number) => {
		return Math.floor(Math.random() * (1 + max - min) + min);
	};

	//RENDERER
	const renderer = new WebGLRenderer({
		canvas: document.getElementById('canvas') as HTMLCanvasElement,
		antialias: true,
	});
	renderer.setClearColor(0x222222);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	//CAMERA
	const camera = new PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 3000);

	//SCENE
	const scene = new Scene();

	//LIGHTS
	const light1 = new AmbientLight(0xffffff, 0.5),
		light2 = new PointLight(0xffffff, 1);
	light2.position.set(-700, 700, 0);

	scene.add(light1);
	scene.add(light2);

	//MAKE THE RINGS
	const geometry = new TorusBufferGeometry(70, 10, 16, 100);
	let material = new MeshPhongMaterial({
		color: colors[totesRando(0, 4)],
		shininess: 400,
	});

	//BUT MAKE A BUNCH OF EM
	for (let i = 0; i < num; i++) {
		const mesh = new Mesh(
			geometry,
			new MeshPhongMaterial({
				color: colors[totesRando(0, 4)],
				shininess: 400,
			})
		);

		mesh.position.set(totesRando(-650, 650), totesRando(-650, 650), totesRando(-1000, -2000));
		const scale = totesRando(1, 3);
		mesh.scale.set(scale, scale, scale);
		scene.add(mesh);
		meshArr.push(mesh);
	}

	//RENDER LOOP
	requestAnimationFrame(render);

	function render() {
		//SPIN EM
		for (let i = 0; i < num; i++) {
			meshArr[i].rotation.x += 0.01 * (i / 6);
			meshArr[i].rotation.y += 0.01 * (i / 6);
		}
		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}

	//IN CASE SOMEONE RESIZES THE BROWSER
	window.addEventListener(
		'resize',
		() => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		},
		false
	);
}

renderCanvas();
