# react-video-graph
Renders a fragment shader graph as a React component.

Uses [`@davidisaaclee/video-graph`](https://github.com/davidisaaclee/video-graph-ts) to encode the graph. 

## Usage
```jsx
<VideoGraph
	graph: this.state.myVideoGraph,
	outputNodeKey: 'master-output',
	runtimeUniforms: {
		'oscillator-node': {
			'currentTime': {
				identifier: 'currentTime',
				value: { type: 'f', data: Date.now() }
			}
		}
	},
	glRef: (glRenderingContext) => this.gl = glRenderingContext
/>
```

## Install
```bash
yarn add @davidisaaclee/react-video-graph
```

## Develop
```bash
# Build using tsc 
yarn build

# Run Storybook on port 9001
yarn run storybook
```


