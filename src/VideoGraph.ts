import * as React from 'react';
import {
	VideoGraph as VideoGraphModel,
	UniformSpecification,
	RenderCache,
	renderGraph, setup,
} from '@davidisaaclee/video-graph';

const e = React.createElement;

interface OwnProps {
	graph: VideoGraphModel;
	outputNodeKey: string | null;
	runtimeUniforms: { [nodeKey: string]: { [uniformKey: string]: UniformSpecification } };
	// How many items in the render cache's circular buffer?
	// Defaults to 1.
	cacheBufferSize?: number;

	glRef: (gl: WebGLRenderingContext | null) => any;
}

type Props = OwnProps & React.HTMLAttributes<HTMLCanvasElement>;

interface State {
}

export default class VideoGraph extends React.Component<Props, State> {

	private gl: WebGLRenderingContext | null = null;
	private cache: RenderCache[] = [];
	private nextCacheIndex: number = 0;

	public componentDidMount() {
		this.resetCaches();
		window.addEventListener('resize', this.resetCaches);
	}

	public componentWillUnmount() {
		window.removeEventListener('resize', this.resetCaches);
	}

	public render() {
		const {
			graph, outputNodeKey, glRef, runtimeUniforms, cacheBufferSize,
			...canvasProps 
		} = this.props;

		if (outputNodeKey != null && this.gl != null) {
			const readCacheIndex = this.nextCacheIndex;
			this.nextCacheIndex = (this.nextCacheIndex + 1) % this.cache.length;
			const writeCacheIndex = this.nextCacheIndex;

			renderGraph(
				this.gl,
				graph,
				runtimeUniforms,
				outputNodeKey,
				this.cache[readCacheIndex],
				this.cache[writeCacheIndex],
			);

		}

		return e('canvas',
			{
				ref: elm => this.updateRef(elm),
				...canvasProps
			},
			null);
	}

	private updateRef(canvas: HTMLElement | null) {
		if (canvas == null) {
			this.props.glRef(null);
			return;
		}

		if (!(canvas instanceof HTMLCanvasElement)) {
			this.props.glRef(null);
			return;
		}

		const gl = canvas.getContext('webgl');
		if (gl == null) {
			this.props.glRef(null);
			console.error("Could not get GL context");
			return;
		}

		this.props.glRef(gl);

		setup(gl);

		this.gl = gl;
	}

	private resetCaches = () => {
		const cacheBufferSize = this.props.cacheBufferSize == null
			? 1
			: this.props.cacheBufferSize;

		if (cacheBufferSize <= 0) {
			throw new Error("Cache buffer length cannot be less than 1");
		}

		this.cache = [];
		for (let i = 0; i < cacheBufferSize; i++) {
			this.cache.push({ textures: {}, framebuffers: {} });
		}
	}

}

