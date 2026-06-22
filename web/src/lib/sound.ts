import type { AlarmSound } from './storage'

let alarmId: ReturnType<typeof setInterval> | null = null
let audioCtx: AudioContext | null = null
let nextNoteTime = 0

export function primeAudio() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
}

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContext()
  return audioCtx
}

function scheduleTones(ac: AudioContext, vol: number) {
  const notes = [523, 659, 784, 1047]
  const step = 0.22
  if (nextNoteTime < ac.currentTime + 0.5) {
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = nextNoteTime + i * step
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25 * vol, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      osc.start(t)
      osc.stop(t + 0.6)
    })
    nextNoteTime += notes.length * step + 0.6
  }
}

function scheduleBell(ac: AudioContext, vol: number) {
  if (nextNoteTime < ac.currentTime + 0.5) {
    [[880, 0], [1108, 0.01], [1320, 0.02]].forEach(([freq, offset]) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = nextNoteTime + offset
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18 * vol, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0)
      osc.start(t)
      osc.stop(t + 2.5)
    })
    nextNoteTime += 3.2
  }
}

function scheduleBeep(ac: AudioContext, vol: number) {
  if (nextNoteTime < ac.currentTime + 0.5) {
    [0, 0.3, 0.6].forEach(offset => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'square'
      osc.frequency.value = 880
      const t = nextNoteTime + offset
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.15 * vol, t + 0.01)
      gain.gain.setValueAtTime(0.15 * vol, t + 0.12)
      gain.gain.linearRampToValueAtTime(0, t + 0.15)
      osc.start(t)
      osc.stop(t + 0.2)
    })
    nextNoteTime += 1.6
  }
}

function scheduleTick(ac: AudioContext, vol: number) {
  if (nextNoteTime < ac.currentTime + 0.5) {
    [0, 0.18].forEach(offset => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = 1400
      const t = nextNoteTime + offset
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.3 * vol, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
      osc.start(t)
      osc.stop(t + 0.1)
    })
    nextNoteTime += 1.2
  }
}

const SOUNDS: Record<AlarmSound, (ac: AudioContext, vol: number) => void> = {
  tones: scheduleTones,
  bell: scheduleBell,
  beep: scheduleBeep,
  tick: scheduleTick,
}

export function startAlarm(sound: AlarmSound = 'tones', volume = 0.7) {
  const ac = getCtx()
  const schedule = SOUNDS[sound]
  const play = () => {
    nextNoteTime = ac.currentTime
    schedule(ac, volume)
    alarmId = setInterval(() => schedule(getCtx(), volume), 100)
  }
  if (ac.state === 'running') {
    play()
  } else {
    ac.resume().then(play)
  }
}

export function stopAlarm() {
  if (alarmId !== null) {
    clearInterval(alarmId)
    alarmId = null
  }
}

export function previewSound(sound: AlarmSound, volume = 0.7) {
  stopAlarm()
  const ac = getCtx()
  const schedule = SOUNDS[sound]
  const play = () => {
    nextNoteTime = ac.currentTime
    schedule(ac, volume)
  }
  if (ac.state === 'running') {
    play()
  } else {
    ac.resume().then(play)
  }
}
