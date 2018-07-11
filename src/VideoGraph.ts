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
	realToCSSPixelRatio?: number;

	glRef: (gl: WebGLRenderingContext | null) => any;
	getReadTextureForNode: (nodeKey: string) => WebGLTexture;
	getWriteTextureForNode: (nodeKey: string) => WebGLTexture;
}

type Props = OwnProps & React.HTMLAttributes<HTMLCanvasElement>;

interface State {
}

export default class VideoGraph extends React.Component<Props, State> {

	private canvas: HTMLElement | null = null;
	private gl: WebGLRenderingContext | null = null;

	public render() {
		const {
			graph, outputNodeKey, glRef,
			realToCSSPixelRatio,
			getReadTextureForNode, getWriteTextureForNode,
			...canvasProps 
		} = this.props;

		if (outputNodeKey != null && this.gl != null) {
			renderGraph(
				this.gl,
				graph,
				{},
				outputNodeKey,
				getReadTextureForNode,
				getWriteTextureForNode,
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

		if (this.canvas === canvas) {
			return;
		}

		this.canvas = canvas;

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

		setup(gl, this.props.realToCSSPixelRatio);

		this.gl = gl;
	}

}

