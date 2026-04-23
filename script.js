let audioContext = null;
let isPlaying = false;
let nextStartTime = 0;
let bpm = 100;
let timerId = null;

let currentBeat = 0;
let beatsPerBar = 4; //valor padrão, pode ser lterado pelo usuário
let beatCounter = document.getElementById('beat-counter');

const bpmSlider = document.getElementById('bpm-slider');
const bpmDisplay = document.getElementById('bpm-display');
const startStopBtn = document.getElementById('start-stop');

const metronomeBeatsContainer = document.getElementById('beats-container');
const beatsButtonMinus = document.getElementById('metronome-controls-button-minus');
const beatsButtonPlus = document.getElementById('metronome-controls-button-plus');
const beatCount = document.getElementById('metronome-controls-beat-count');

let MIN_BEATS = 2;
let MAX_BEATS = 12;

bpmSlider.oninput = () => {
    bpm = bpmSlider.value;
    bpmDisplay.innerText = bpm;
};

//função pra renderizar as batidas selecionadas pelo usuário
function renderBeats() {
    metronomeBeatsContainer.innerHTML = '';
    for (let i = 1; i <= beatsPerBar; i++) {
        createVisualBeatElement(i);
    }
    updateGridLayout();
}

//função para 'montar' quantidades de batidas/bolinhas
function createVisualBeatElement(iteration) {
    const divBeat = document.createElement('div');
    divBeat.classList.add('visualBeat');
    const spanBeatNumber = document.createElement('span');
    spanBeatNumber.textContent = iteration;
    divBeat.appendChild(spanBeatNumber);
    metronomeBeatsContainer.appendChild(divBeat);
}

function updateGridLayout() {
    // Calcula quantas colunas são necessárias para manter apenas 2 linhas
    // Se tivermos 8 batidas, precisamos de 4 colunas.
    // Se tivermos 7 batidas, precisamos de 4 colunas (uma fica vazia embaixo).
    let columns;

    if (beatsPerBar <= 5) {
        columns = beatsPerBar;
    } else {
        // Se for > 5, divide por 2 e arredonda para cima
        columns = Math.ceil(beatsPerBar / 2);
    }

    // Aplica dinamicamente ao estilo do container
    metronomeBeatsContainer.style.gridTemplateColumns = `repeat(${columns}, auto)`;
}

// Lógica do botão Remover batidas
beatsButtonMinus.addEventListener('click', () => {
    if (beatsPerBar > MIN_BEATS) {
        beatsPerBar--;
        beatCount.textContent = beatsPerBar;
        renderBeats();
    }
});

// Lógica do botão Adicionar batidas
beatsButtonPlus.addEventListener('click', () => {
    if (beatsPerBar < MAX_BEATS) {
        beatsPerBar++;
        beatCount.textContent = beatsPerBar;
        renderBeats();
    }
});

const decreaseTempo = document.getElementById('decreaseTempo');
const increaseTempo = document.getElementById('increaseTempo');

// Lógica do botão diminuir bpm
decreaseTempo.addEventListener('click', () => {
    if (bpm > 40) {
        bpm--;
        bpmSlider.value = bpm;
        bpmDisplay.innerText = bpm;
    }
});

// Lógica do botão aumentar bpm
increaseTempo.addEventListener('click', () => {
    if (bpm < 260) {
        bpm++;
        bpmSlider.value = bpm;
        bpmDisplay.innerText = bpm;
    }
});

// Função para atualizar a cor na tela
function updateBallVisual(indice) {
    // Buscamos as bolinhas ATUAIS que estão no DOM
    const currentBalls = document.querySelectorAll('.visualBeat');
    
    // Atualiza o contador de texto (ex: 1, 2, 3...)
    // Somamos +1 porque o indice vem de 0 a (beatsPerBar - 1)
    if (beatCounter) {
        beatCounter.textContent = indice + 1;
    }

    currentBalls.forEach((ball, i) => {
        ball.classList.remove('active');
        ball.classList.remove('forte');

        if (i === indice) {
            ball.classList.add('active');
            if (i === 0) ball.classList.add('forte');
        }
    });
}

function playClick(beatNumber, executionTime) {
    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();

    const actualBeatInBar = beatNumber % beatsPerBar;

    if (beatNumber % beatsPerBar === 0) {
        osc.frequency.value = 1200;
    } else {
        osc.frequency.value = 800;
    }

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, executionTime + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, executionTime + 0.05);

    osc.connect(envelope);
    envelope.connect(audioContext.destination);

    osc.start(executionTime);
    osc.stop(executionTime + 0.05);

    // --- SINCRONIZAÇÃO VISUAL ---
    // Calculamos quanto tempo falta para o som tocar e agendamos a luz
    const timeUntilSound = (executionTime - audioContext.currentTime) * 1000;

    setTimeout(() => {
        updateBallVisual(beatNumber % beatsPerBar);
    }, timeUntilSound);
}

function scheduler() {
    while (nextStartTime < audioContext.currentTime + 0.1) {
        playClick(currentBeat, nextStartTime);
        nextStartTime += 60 / bpm;
        currentBeat++;
    }
    timerId = setTimeout(scheduler, 25);
}

startStopBtn.onclick = () => {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();

    if (isPlaying) {
        clearTimeout(timerId);
        startStopBtn.innerText = "Start";
        if(beatCounter) beatCounter.textContent = '--';
        // Limpa as bolinhas
        document.querySelectorAll('.visualBeat').forEach(b => {
            b.classList.remove('active');
            b.classList.remove('forte');
        });
    } else {
        if (audioContext.state === 'suspended') audioContext.resume();
        nextStartTime = audioContext.currentTime;
        currentBeat = 0; // Reset para começar do 1
        scheduler();
        startStopBtn.innerText = "Stop";
    }
    isPlaying = !isPlaying;
};

renderBeats();
updateGridLayout();