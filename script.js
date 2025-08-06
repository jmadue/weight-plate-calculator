// script.js
// Lógica de la calculadora y el modo de entrenamiento para la aplicación de discos.

document.addEventListener('DOMContentLoaded', () => {
  // Elementos comunes
  const calculatorBtn = document.getElementById('calculatorBtn');
  const trainingBtn = document.getElementById('trainingBtn');
  const calculatorMode = document.getElementById('calculatorMode');
  const trainingMode = document.getElementById('trainingMode');

  // Modo calculadora elementos
  const calculateBtn = document.getElementById('calculateBtn');
  const targetWeightInput = document.getElementById('targetWeight');
  const barTypeSelect = document.getElementById('barType');
  const minimalDiscsCheckbox = document.getElementById('minimalDiscs');
  const calcResult = document.getElementById('calcResult');
  const perSideResult = document.getElementById('perSideResult');
  const discSummary = document.getElementById('discSummary');
  const barVisualization = document.getElementById('barVisualization');

  // Modo entrenamiento elementos
  const trainingSetup = document.getElementById('trainingSetup');
  const trainingGame = document.getElementById('trainingGame');
  const startTrainingBtn = document.getElementById('startTrainingBtn');
  const trainingBarType = document.getElementById('trainingBarType');
  const continuousMode = document.getElementById('continuousMode');
  const challengeTitle = document.getElementById('challengeTitle');
  const discInputsContainer = document.getElementById('discInputs');
  const checkAnswerBtn = document.getElementById('checkAnswerBtn');
  const nextChallengeBtn = document.getElementById('nextChallengeBtn');
  const feedbackEl = document.getElementById('feedback');
  const currentTimeEl = document.getElementById('currentTime');
  const currentScoreEl = document.getElementById('currentScore');
  const highScoreEl = document.getElementById('highScore');

  // Datos globales
  const discWeights = [25, 20, 15, 10, 5, 2.5];
  const discColors = {
    25: getComputedStyle(document.documentElement).getPropertyValue('--disc-25'),
    20: getComputedStyle(document.documentElement).getPropertyValue('--disc-20'),
    15: getComputedStyle(document.documentElement).getPropertyValue('--disc-15'),
    10: getComputedStyle(document.documentElement).getPropertyValue('--disc-10'),
    5: getComputedStyle(document.documentElement).getPropertyValue('--disc-5'),
    2.5: getComputedStyle(document.documentElement).getPropertyValue('--disc-2_5'),
  };

  // Variables de entrenamiento
  let currentTarget = null;
  let currentBarWeight = null;
  let currentPerSide = null;
  let startTime = null;
  let timerInterval = null;
  let currentScore = 0;
  let highScore = Number(localStorage.getItem('weightCalcHighScore') || '0');

  // Indica si el entrenamiento está en modo continuo (almacenado al iniciar)
  let isContinuous = false;

  // Inicializar high score en interfaz
  highScoreEl.textContent = highScore;

  // Funciones auxiliares
  /**
   * Calcula la combinación de discos para un peso por lado.
   * Usa algoritmo greedy para minimizar el número de discos.
   * Devuelve objeto con discos por peso y total de discos.
   *
   * @param {number} weightPerSide Peso que debe ir en un lado.
   * @returns {{combo: Record<string, number>, totalDiscs: number}}
   */
  function calculateDiscCombination(weightPerSide) {
    const combo = {};
    let remaining = weightPerSide;
    let totalDiscs = 0;
    discWeights.forEach((w) => {
      const count = Math.floor(remaining / w);
      combo[w] = count;
      totalDiscs += count;
      remaining -= count * w;
    });
    // Rounding issues: if small remainder due to floating point, ignore
    return { combo, totalDiscs };
  }

  /**
   * Construye la visualización de discos en ambos lados de la barra.
   *
   * @param {Record<string, number>} combo Combinación de discos por lado.
   */
  function buildBarVisualization(combo) {
    barVisualization.innerHTML = '';
    // Crear contenedores de lado izquierdo y derecho
    const leftSide = document.createElement('div');
    leftSide.classList.add('bar-side');
    const rightSide = document.createElement('div');
    rightSide.classList.add('bar-side');
    // Para cada peso, crea elementos de disco para ambos lados
    discWeights.forEach((w) => {
      const count = combo[w];
      for (let i = 0; i < count; i++) {
        const discLeft = document.createElement('div');
        discLeft.classList.add('disc');
        discLeft.style.backgroundColor = discColors[w];
        discLeft.style.width = `${w * 3.5}px`;
        leftSide.appendChild(discLeft);
        const discRight = discLeft.cloneNode();
        rightSide.appendChild(discRight);
      }
    });
    barVisualization.appendChild(leftSide);
    barVisualization.appendChild(rightSide);
  }

  /**
   * Cambia la visibilidad de los modos y las clases activas.
   */
  function switchMode(mode) {
    if (mode === 'calculator') {
      calculatorMode.classList.remove('hidden');
      trainingMode.classList.add('hidden');
      calculatorBtn.classList.add('active');
      trainingBtn.classList.remove('active');
    } else {
      calculatorMode.classList.add('hidden');
      trainingMode.classList.remove('hidden');
      calculatorBtn.classList.remove('active');
      trainingBtn.classList.add('active');
    }
  }

  /**
   * Genera un nuevo reto para el modo de entrenamiento.
   */
  function generateNewChallenge() {
    // Limpia intervalos y feedback
    clearInterval(timerInterval);
    feedbackEl.textContent = '';
    feedbackEl.style.color = '';
    // Leer configuración
    currentBarWeight = parseFloat(trainingBarType.value);
    // Generar peso objetivo aleatorio: (target - barWeight) divisible por 5
    // permitimos múltiplos de 5 entre 30 y 200 kg del peso total.
    const minMultiple = 6; // 6*5=30
    const maxMultiple = 40; // 40*5=200
    const randomMultiple = Math.floor(
      Math.random() * (maxMultiple - minMultiple + 1)
    ) + minMultiple;
    const targetWithoutBar = randomMultiple * 5;
    currentTarget = currentBarWeight + targetWithoutBar;
    currentPerSide = targetWithoutBar / 2;
    // Construir título del reto
    challengeTitle.textContent = `Objetivo: ${currentTarget.toFixed(
      1
    )} kg (Barra ${currentBarWeight} kg)`;
    // Construir entradas de discos
    discInputsContainer.innerHTML = '';
    discWeights.forEach((w) => {
      const row = document.createElement('div');
      row.classList.add('disc-input-row');
      // Color
      const colorBox = document.createElement('div');
      colorBox.classList.add('disc-color');
      colorBox.style.backgroundColor = discColors[w];
      // Etiqueta
      const label = document.createElement('span');
      label.classList.add('weight-label');
      label.textContent = `${w}`;
      // Input
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = '0';
      input.step = '1';
      input.setAttribute('data-weight', w);
      row.appendChild(colorBox);
      row.appendChild(label);
      row.appendChild(input);
      discInputsContainer.appendChild(row);
    });
    // Reiniciar tiempo y mostrar 0
    currentTimeEl.textContent = '0.0';
    // Guardar hora de inicio y arrancar intervalo de tiempo
    startTime = Date.now();
    timerInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      currentTimeEl.textContent = elapsed.toFixed(1);
    }, 100);
    // Ocultar botón de siguiente desafío (por si estaba visible)
    if (nextChallengeBtn) {
      nextChallengeBtn.classList.add('hidden');
    }
  }

  /**
   * Comprueba la respuesta del usuario en el modo entrenamiento.
   */
  function checkTrainingAnswer() {
    // Calcular peso total introducido
    let sumPerSide = 0;
    let discsUsed = 0;
    const inputs = discInputsContainer.querySelectorAll('input');
    inputs.forEach((input) => {
      const count = parseInt(input.value) || 0;
      const weight = parseFloat(input.getAttribute('data-weight'));
      sumPerSide += weight * count;
      discsUsed += count;
    });
    const totalWeight = currentBarWeight + 2 * sumPerSide;
    // Comparar con el objetivo
    if (Math.abs(totalWeight - currentTarget) < 0.001) {
      // Correcto
      // Detener cronómetro
      clearInterval(timerInterval);
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      // Calcular puntos: base 100 puntos menos el tiempo (más rápido, más puntos)
      let points = Math.max(10, Math.round(100 - elapsedSeconds));
      // Calcular combinación óptima de discos
      const { totalDiscs: optimalDiscs } = calculateDiscCombination(currentPerSide);
      if (discsUsed === optimalDiscs) {
        points += 20; // bono por usar mínimo de discos
      }
      currentScore += points;
      feedbackEl.textContent = `¡Correcto! Has ganado ${points} puntos.`;
      feedbackEl.style.color = '#43a047'; // verde
      currentScoreEl.textContent = currentScore;
      // Actualizar récord si aplica
      if (currentScore > highScore) {
        highScore = currentScore;
        highScoreEl.textContent = highScore;
        localStorage.setItem('weightCalcHighScore', String(highScore));
      }
      // Generar nuevo reto según modo
      if (isContinuous) {
        // Inicia inmediatamente el siguiente desafío. La retroalimentación se mantiene brevemente
        generateNewChallenge();
      } else {
        // Mostrar botón para pasar al siguiente desafío manualmente
        if (nextChallengeBtn) {
          nextChallengeBtn.classList.remove('hidden');
        }
      }
    } else {
      // Incorrecto
      feedbackEl.textContent = 'Respuesta incorrecta, vuelve a intentarlo.';
      feedbackEl.style.color = '#e53935'; // rojo
    }
  }

  /**
   * Maneja el cálculo en modo calculadora.
   */
  function handleCalculate() {
    const total = parseFloat(targetWeightInput.value);
    const barWeight = parseFloat(barTypeSelect.value);
    const useMinimal = minimalDiscsCheckbox.checked;
    if (isNaN(total) || total <= 0) {
      alert('Introduce un peso total válido.');
      return;
    }
    if (isNaN(barWeight)) {
      alert('Selecciona un tipo de barra.');
      return;
    }
    if (total < barWeight) {
      alert('El peso total debe ser mayor o igual al peso de la barra.');
      return;
    }
    const remaining = total - barWeight;
    // Debe ser divisible entre 5 (porque 2*2.5=5)
    if (remaining % 5 !== 0) {
      perSideResult.textContent =
        'Con la combinación actual de discos sólo se pueden formar incrementos de 5 kg (suma de discos en ambos lados). Ajusta el peso objetivo.';
      calcResult.classList.remove('hidden');
      discSummary.textContent = '';
      barVisualization.innerHTML = '';
      return;
    }
    const weightPerSide = remaining / 2;
    // Calcular combinación
    const { combo, totalDiscs } = calculateDiscCombination(weightPerSide);
    // Crear resumen de discos
    let summaryText = '';
    discWeights.forEach((w) => {
      const count = combo[w];
      if (count > 0) {
        summaryText += `${count} × ${w} kg, `;
      }
    });
    summaryText = summaryText.replace(/, $/, '');
    perSideResult.textContent = `Debes colocar ${weightPerSide.toFixed(
      1
    )} kg por lado.`;
    discSummary.textContent = summaryText
      ? `Combinación por lado: ${summaryText}`
      : 'No se necesitan discos (el peso coincide con la barra).';
    // Visualizar
    buildBarVisualization(combo);
    calcResult.classList.remove('hidden');
  }

  // Event listeners
  calculatorBtn.addEventListener('click', () => switchMode('calculator'));
  trainingBtn.addEventListener('click', () => switchMode('training'));
  calculateBtn.addEventListener('click', handleCalculate);
  startTrainingBtn.addEventListener('click', () => {
    trainingSetup.classList.add('hidden');
    trainingGame.classList.remove('hidden');
    // Reset score
    currentScore = 0;
    currentScoreEl.textContent = currentScore;
    // Registrar si se activó el modo continuo antes de ocultar el setup
    isContinuous = continuousMode.checked;
    generateNewChallenge();
  });
  checkAnswerBtn.addEventListener('click', checkTrainingAnswer);
  nextChallengeBtn.addEventListener('click', () => {
    // Ocultar el botón y generar nuevo reto manualmente
    nextChallengeBtn.classList.add('hidden');
    generateNewChallenge();
  });
});
