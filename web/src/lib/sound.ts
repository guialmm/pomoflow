let alarmId: ReturnType<typeof setInterval> | null = null
let audioCtx: AudioContext | null = null
let nextNoteTime = 0

// Call this inside a click handler so Safari allows AudioContext creation
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

function scheduleNotes(ac: AudioContext) {
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
      gain.gain.linearRampToValueAtTime(0.25, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      osc.start(t)
      osc.stop(t + 0.6)
    })
    nextNoteTime += notes.length * step + 0.6
  }
}

export function startAlarm() {
  const ac = getCtx()
  const play = () => {
    nextNoteTime = ac.currentTime
    scheduleNotes(ac)
    alarmId = setInterval(() => scheduleNotes(getCtx()), 100)
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
