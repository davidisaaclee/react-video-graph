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

	glRef: (gl: WebGLRenderingContext | null) => any;
}

type Props = OwnProps & React.HTMLAttributes<HTMLCanvasElement>;

interface State {
}

export default class VideoGraph extends React.Component<Props, State> {

	private gl: WebGLRenderingContext | null = null;
	private cache: RenderCache = { textures: {}, framebuffers: {} };

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

	public render() {
		const { graph, outputNodeKey, glRef, runtimeUniforms, ...canvasProps } = this.props;

		if (outputNodeKey != null && this.gl != null) {
			renderGraph(
				this.gl,
				graph,
				runtimeUniforms,
				outputNodeKey,
				this.cache,
			);
		}

		return e('canvas',
			{
				ref: elm => this.updateRef(elm),
				...canvasProps
			},
			null);
	}
}

