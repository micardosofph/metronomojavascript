let audioContext = null;
let isPlaying = false;
let nextStartTime = 0;
let bpm = 100;
let timerId = null;
let batidaAtual = 0;
const batidasPorCompasso = 4;

// Selecionamos todas as bolinhas de uma vez (vira um Array/Lista)
const bolinhas = document.querySelectorAll('.metronomeBall');

const bpmSlider = document.getElementById('bpm-slider');
const bpmDisplay = document.getElementById('bpm-display');
const startStopBtn = document.getElementById('start-stop');

bpmSlider.oninput = () => {
    bpm = bpmSlider.value;
    bpmDisplay.innerText = bpm;
};

// Função para atualizar a cor na tela
function atualizarVisual(indice) {
    bolinhas.forEach((b, i) => {
        b.classList.remove('active');
        b.classList.remove('forte'); // Limpa a classe de batida forte
        
        if (i === indice) {
            b.classList.add('active');
            // Se for a primeira bolinha do compasso, adiciona a classe 'forte'
            if (i === 0) b.classList.add('forte');
        }
    });
}

function playClick(numeroDaBatida, tempoDeExecucao) {
    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();

    if (numeroDaBatida % batidasPorCompasso === 0) {
        osc.frequency.value = 1200; 
    } else {
        osc.frequency.value = 800;  
    }

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, tempoDeExecucao + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, tempoDeExecucao + 0.05);

    osc.connect(envelope);
    envelope.connect(audioContext.destination);

    osc.start(tempoDeExecucao);
    osc.stop(tempoDeExecucao + 0.05);

    // --- SINCRONIZAÇÃO VISUAL ---
    // Calculamos quanto tempo falta para o som tocar e agendamos a luz
    const tempoAteOSom = (tempoDeExecucao - audioContext.currentTime) * 1000;
    
    setTimeout(() => {
        atualizarVisual(numeroDaBatida % batidasPorCompasso);
    }, tempoAteOSom);
}

function scheduler() {
    while (nextStartTime < audioContext.currentTime + 0.1) {
        playClick(batidaAtual, nextStartTime);
        nextStartTime += 60 / bpm;
        batidaAtual++;
    }
    timerId = setTimeout(scheduler, 25);
}

startStopBtn.onclick = () => {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();

    if (isPlaying) {
        clearTimeout(timerId);
        startStopBtn.innerText = "Start";
        // Limpa as bolinhas ao parar
        bolinhas.forEach(b => b.classList.remove('active'));
    } else {
        if (audioContext.state === 'suspended') audioContext.resume();
        
        nextStartTime = audioContext.currentTime;
        batidaAtual = 0;
        scheduler();
        startStopBtn.innerText = "Stop";
    }
    isPlaying = !isPlaying;
};