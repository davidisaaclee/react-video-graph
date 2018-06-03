import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { VideoGraph as VideoGraphModel } from 'video-graph';
import VideoGraph from '../src/VideoGraph';
import createOscillatorModGraph from './graphs/oscillator-mod';
import uniformDictFromArray from './utility/uniformDictFromArray';

storiesOf('VideoGraph', module)
	.add('basic', () => 
		e(App, {}, null))

const e = React.createElement;

const CANVAS_SIZE = { x: 500, y: 500 };

interface State {
	videoGraph: VideoGraphModel;
	oscFreq: number;
	lfoFreq: number;
	fps: number;
	frameIndex: number;
	startTime: number;
}

class App extends React.Component<{}, State> {
	state = {
		videoGraph: {
			nodes: {},
			edges: {}
		},
		oscFreq: 10,
		lfoFreq: 0.7,
		fps: 60,
		frameIndex: 0,
		startTime: Date.now(),
	}

	private gl: WebGLRenderingContext | null = null;
	private isAnimating: boolean = true;

	private frame() {
		if (!this.isAnimating) {
			return;
		}

		const frameIndex =
			Math.floor((Date.now() - this.state.startTime) / (1000 / this.state.fps));

		if (frameIndex !== this.state.frameIndex) {
			this.setState({ frameIndex });
		}

		window.requestAnimationFrame(() => this.frame());
	}

	public componentDidMount() {
		this.isAnimating = true;
		this.frame();
	}

	public componentWillUnmount() {
		this.isAnimating = false;
	}

  public render() {
		let runtimeUniforms = {};
		const gl = this.gl;
		if (gl != null) {
			runtimeUniforms = {
				'oscillator': uniformDictFromArray([
					{
						identifier: 'inputTextureDimensions',
						value: {
							type: '2f',
							data: [gl.canvas.width, gl.canvas.height]
						}
					},
					{
						identifier: 'phaseOffset',
						value: {
							type: 'f',
							data: (this.state.frameIndex * 2 * Math.PI / this.state.oscFreq) % 1
						}
					}
				]),
				'lfo': uniformDictFromArray([
					{
						identifier: 'inputTextureDimensions',
						value: {
							type: '2f',
							data: [gl.canvas.width, gl.canvas.height]
						}
					},
					{
						identifier: 'phaseOffset',
						value: {
							type: 'f',
							data: (this.state.frameIndex * 2 * Math.PI / this.state.lfoFreq) % 1
						}
					}
				])
			};
		}

		return e(VideoGraph,
			{
				glRef: (gl: WebGLRenderingContext | null) => {
					if (this.gl === gl) {
						return;
					}

					if (gl != null) {
						this.gl = gl;
						this.setState({
							videoGraph: createOscillatorModGraph(
								gl,
								this.state.oscFreq,
								this.state.lfoFreq,
							),
						});
					}
				},
				graph: this.state.videoGraph,
				outputNodeKey: this.gl == null
					? null
					: "oscillator",
				runtimeUniforms,
				style: {
					width: CANVAS_SIZE.x,
					height: CANVAS_SIZE.y,
				}
			},
			null);
  }
}

