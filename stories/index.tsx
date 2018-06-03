import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { keyBy } from 'lodash';
import { 
	VideoGraph as VideoGraphModel, createProgramWithFragmentShader,
	UniformSpecification
} from 'video-graph';
import VideoGraph from '../src/VideoGraph';
import constantFragmentShader from './shaders/constant';
import oscillatorShader from './shaders/oscillator';

storiesOf('VideoGraph', module)
	.add('basic', () => 
		e(App, {}, null))


const e = React.createElement;

const CANVAS_SIZE = { x: 500, y: 500 };

function uniformDictFromArray(
	uniforms: UniformSpecification[]
): { [iden: string]: UniformSpecification } {
	return keyBy(uniforms, s => s.identifier);
}

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

	private createGraph(gl: WebGLRenderingContext): VideoGraphModel {
		return {
			nodes: {
				'constant': {
					program: createProgramWithFragmentShader(gl, constantFragmentShader),
					uniforms: uniformDictFromArray([
						{
							identifier: 'value',
							value: { type: '3f', data: [1, 0, 0] }
						}
					])
				},
				
				'oscillator': {
					program: createProgramWithFragmentShader(gl, oscillatorShader),
					uniforms: uniformDictFromArray(
						[
							{
								identifier: 'frequency',
								value: { type: 'f', data: this.state.oscFreq }
							},
						])
				},

				'lfo': {
					program: createProgramWithFragmentShader(gl, oscillatorShader),
					uniforms: uniformDictFromArray(
						[
							{
								identifier: 'frequency',
								value: { type: 'f', data: this.state.lfoFreq }
							},
						])
				},

			},
			edges: {
				/*
				'osc.rotation <- constant': {
					src: 'oscillator',
					dst: 'constant',
					metadata: { uniformIdentifier: 'rotationTheta' }
				},
				*/

				'osc.rotation <- lfo': {
					src: 'oscillator',
					dst: 'lfo',
					metadata: { uniformIdentifier: 'rotationTheta' }
				},

				'lfo.rotation <- constant': {
					src: 'lfo',
					dst: 'constant',
					metadata: { uniformIdentifier: 'rotationTheta' }
				},
			}
		};
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
							videoGraph: this.createGraph(gl)
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

