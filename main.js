import "./style.css"
import { filter } from "lodash"

/**
 * @type HTMLDivElement
 */
const APP = document.querySelector("#app")

/**
 * @type HTMLCanvasElement
 */
let CANVAS_ELEMENT
/**
 * @type CanvasRenderingContext2D
 */
let CANVAS_CONTEXT
/**
 * @type number
 */
let CANVAS_W
/**
 * @type number
 */
let CANVAS_H

/**
 * @type HTMLSelectElement
 */
let SELECT

/**
 * @type AudioContext
 */
let AUDIO_CONTEXT

/**
 * @type AnalyserNode
 */
let ANALYSER_NODE

/**
 * @type Uint8Array
 */
let ANALYSER_BINS

async function setup() {
  await navigator.mediaDevices.getUserMedia({audio:true})
  await setupCanvas()
  await setupStream()
}

async function setupCanvas() {
  if(!!CANVAS_ELEMENT) return

  CANVAS_ELEMENT = document.createElement("canvas")
  CANVAS_CONTEXT = CANVAS_ELEMENT.getContext("2d")
    CANVAS_ELEMENT.style.position = "absolute"
    CANVAS_ELEMENT.style.top    =   "0px"
    CANVAS_ELEMENT.style.left   =   "0px"
    CANVAS_ELEMENT.style.width  = "100vw"
    CANVAS_ELEMENT.style.height = "100vh"
  APP.appendChild(CANVAS_ELEMENT)

  // onresize
  new ResizeObserver(() => {
    CANVAS_W = CANVAS_ELEMENT.width  = CANVAS_ELEMENT.getBoundingClientRect().width
    CANVAS_H = CANVAS_ELEMENT.height = CANVAS_ELEMENT.getBoundingClientRect().height
  }).observe(CANVAS_ELEMENT)
}

async function setupStream() {
  navigator.mediaDevices.getDisplayMedia({audio: true}).then(stream => {
    (AUDIO_CONTEXT = new AudioContext()).createMediaStreamSource(stream).connect(ANALYSER_NODE = new AnalyserNode(AUDIO_CONTEXT))
    ANALYSER_BINS = new Uint8Array(ANALYSER_NODE.frequencyBinCount)
  })
}

function animate(t0 = 0, t1 = t0, t2 = t1) {
  const
    t  = (t2 - t0) / 1000,
    dt = (t2 - t1) / 1000;
  if(!!ANALYSER_NODE) {
    update(t, dt)
    render(t, dt)
  }
  requestAnimationFrame(t3 => animate(t0, t2, t3))
}

function update(t, dt) {
  ANALYSER_NODE.getByteFrequencyData(ANALYSER_BINS)
}

const DEG2RAD = Math.PI / 180

function render(t, dt) {
  const
    MIN = Math.min(CANVAS_W, CANVAS_H),
    MAX = Math.max(CANVAS_W, CANVAS_H),

    NUMBER_OF_RINGS = 9,
    RING_RADIUS = .25 * MIN,
    RING_TRAVEL = .25 * MIN,
    RING_WIDTH  = .05 * MIN;

  CANVAS_CONTEXT.globalCompositeOperation = "source-over"
  CANVAS_CONTEXT.fillStyle = "#000"
  CANVAS_CONTEXT.fillRect(0, 0, CANVAS_W, CANVAS_H)

  CANVAS_CONTEXT.globalCompositeOperation = "lighter"
  CANVAS_CONTEXT.lineWidth = RING_WIDTH

  // console.log(ANALYSER_BINS)

  for(let i = 0; i < NUMBER_OF_RINGS; i ++) {
    const
      a = Math.floor( i      * ANALYSER_BINS.length / NUMBER_OF_RINGS),
      b = Math.floor((i + 1) * ANALYSER_BINS.length / NUMBER_OF_RINGS),
      value = average(ANALYSER_BINS, a, b) / 256,
      angle = 360 * i / NUMBER_OF_RINGS,
      dx = value * Math.cos((angle - 90) * DEG2RAD) * RING_TRAVEL,
      dy = value * Math.sin((angle - 90) * DEG2RAD) * RING_TRAVEL;
    switch(i % 3) {
      case 0: CANVAS_CONTEXT.strokeStyle = "#f00"; break;
      case 1: CANVAS_CONTEXT.strokeStyle = "#0f0"; break;
      case 2: CANVAS_CONTEXT.strokeStyle = "#00f"; break;
    }

    CANVAS_CONTEXT.beginPath()
    CANVAS_CONTEXT.arc(
      (CANVAS_W / 2) + dx,
      (CANVAS_H / 2) + dy,
      RING_RADIUS, 0, 2 * Math.PI
    )
    CANVAS_CONTEXT.stroke()
  }
}

function average(a, from, to) {
  let sum = 0
  for(let i = from; i < to; i ++)
    sum += a[i]
  return sum / (to - from)
}

setup().then(
  () => requestAnimationFrame(
    t0 => requestAnimationFrame(
      t1 => requestAnimationFrame(
        t2 => animate(t0, t1, t2)))))
