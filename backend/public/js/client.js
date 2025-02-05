/*
1. Onboarding
2. Start Game
3. Arduino
  3.1. Ping Distance Sensor
  3.2. Servo Motor
4. Quiz Logic
5. Socket IO / websockets
6. WebRTC / SimplePeer
*/

/*=======================================
          1. Onboarding
    =========================================*/

const $tutorialContainer = document.querySelector('.tutorial__container');
const $tutorialPanel = document.querySelector('.tutorial__panel');
const $gameContainer = document.getElementById('game__container');
const $backButton = document.querySelector('.btn__back');
const $tutorialIntroContainer = document.querySelector(
  '.tutorial__intro__container'
);
const $tutorailConnectContainer = document.querySelector(
  '.tutorial__connect__container'
);
const $tutorialTutorialContainer = document.querySelector(
  '.tutorial__tutorial__container'
);
const $usernameContainer = document.querySelector(
  '.tutorial__username__container'
);
const $username = document.getElementById('nameInput');
const $nextButton = document.querySelector('.btn__next');
const $tutorialSteps = document.querySelector('.tutorial__steps');
const $nameInput = document.getElementById('nameInput');
let stepNumber = 0;
let usernameValue = '';

//Showcase onboarding
const updateUserInterface = () => {
  if (stepNumber === 0) {
    $tutorialIntroContainer.style.display = 'flex';
    $tutorialPanel.style.backgroundImage = 'url(./assets/introsimpsons.png)';
    $tutorialPanel.style.backgroundRepeat = 'no-repeat';
    $tutorialPanel.style.backgroundSize = '64%';
    $tutorialPanel.style.backgroundPosition = 'bottom 83% left 10%';
    $usernameContainer.style.display = 'none';
    $tutorailConnectContainer.style.display = 'none';
    $tutorialTutorialContainer.style.display = 'none';
    $gameContainer.style.display = 'none';
    $tutorialSteps.classList.add('visibility');
    $backButton.classList.add('visibility');
    $nextButton.textContent = "Let's begin!";
    $nextButton.classList.add('btn__next--animate');
    $nextButton.addEventListener('mouseenter', () => {
    $nextButton.style.animationPlayState = 'paused';
    });
    $nextButton.addEventListener('mouseleave', () => {
      $nextButton.style.animationPlayState = 'running';
    });
  } else if (stepNumber === 1) {
    $tutorialPanel.style.backgroundImage = 'none';
    $tutorialIntroContainer.style.display = 'none';
    $usernameContainer.style.display = 'flex';
    $tutorailConnectContainer.style.display = 'none';
    $tutorialTutorialContainer.style.display = 'none';
    $gameContainer.style.display = 'none';
    $tutorialSteps.classList.remove('visibility');
    $tutorialSteps.textContent = '1/3';
    $backButton.classList.remove('visibility');
    $nextButton.textContent = 'Continue';
    $nextButton.classList.remove('btn__next--animate');
    $nextButton.addEventListener('click', (event) => {
      handleSubmitName(event);
    });
    $nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    });
  } else if (stepNumber === 2) {
    $tutorialIntroContainer.style.display = 'flex';
    $tutorialPanel.style.backgroundImage = 'url(./assets/cat.png)';
    $tutorialPanel.style.backgroundRepeat = 'no-repeat';
    $tutorialPanel.style.backgroundSize = '50%';
    $tutorialPanel.style.backgroundPosition = 'bottom 50% left 10%';
    $tutorialIntroContainer.style.display = 'none';
    $usernameContainer.style.display = 'none';
    $tutorailConnectContainer.style.display = 'flex';
    $tutorialTutorialContainer.style.display = 'none';
    $gameContainer.style.display = 'none';
    $nextButton.textContent = 'Continue';
    $tutorialSteps.textContent = '2/3';
  } else if (stepNumber === 3) {
    $tutorialPanel.style.backgroundImage = 'none';
    $tutorialIntroContainer.style.display = 'none';
    $usernameContainer.style.display = 'none';
    $tutorailConnectContainer.style.display = 'none';
    $tutorialTutorialContainer.style.display = 'flex';
    $gameContainer.style.display = 'none';
    $nextButton.textContent = 'Start Quiz';
    $nextButton.style.backgroundColor = '#fbd239';
    $tutorialSteps.textContent = '3/3';
  } else if (stepNumber === 4) {
    $tutorialContainer.style.display = 'none';
    $gameContainer.style.display = 'flex';
    sendMyName();
  }
};

$nextButton.addEventListener('click', () => {
  if (stepNumber < 4) {
    stepNumber++;
    updateUserInterface();
  }
});

$backButton.addEventListener('click', () => {
  if (stepNumber > 0) {
    stepNumber--;
    updateUserInterface();
  }
});

/*=======================================
          2. Start Game 
    =========================================*/

const $video = document.getElementById('myVideo');
const $otherVideo = document.getElementById('otherVideo');
const $otherSocketIds = document.getElementById('otherSocketIds');

let socket;
let peer;
let connectedPeerId;
let myStream;
let peerId;

let $questionElement = document.querySelector(`#question`);
const $margeCount = document.querySelector(`#natureScore`);
const $homerCount = document.querySelector(`#indoorScore`);
const $questionsContainer = document.querySelector(`.questions`);

const $resultContainer = document.querySelector(`.showResult`);
const $resultTitle = document.querySelector(`.result__title`);
const $resultText = document.querySelector(`.result__text`);
const $resultSecondText = document.querySelector(`.result__text--two`);
const $btnRetakeQuiz = document.querySelector(`.btn__retake`);

const $scoreSection = document.querySelector(`.questions__scoreboard`);

const $chooseAnswerA = document.querySelector(`#optionOne`);
const $chooseAnswerB = document.querySelector(`#optionTwo`);
const $img__simpsons = document.querySelectorAll(`.img__simpsons`);

const $userContainer = document.querySelector(`.container__users`);
const $scoreUserHomer = document.querySelector(`.user__score--homer`);
const $scoreUserMarge = document.querySelector(`.user__score--marge`);

const $finalResultRemote = document.querySelector('.showResult--remote');
const $finalRemoteText = document.querySelector('.result__final');

/*=======================================
          3. Arduino 
    =========================================*/
const hasWebSerial = 'serial' in navigator;
let isConnected = false; 

const $notSupported = document.getElementById('not-supported');
const $supported = document.getElementById('supported');
const $notConnected = document.getElementById('not-connected');
const $connected = document.getElementById('connected');

const $connectButton = document.getElementById('connect-button');

let writer;

//filter ports
const arduinoInfo = {
  usbProductId: 32822,
  usbVendorId: 9025,
};
let connectedArduinoPorts = [];

const isArduinoPort = (port) => {
  const info = port.getInfo();
  return (
    info.usbProductId === arduinoInfo.usbProductId &&
    info.usbVendorId === arduinoInfo.usbVendorId
  );
};

const handleClickConnect = async () => {
  const port = await navigator.serial.requestPort();
  const info = port.getInfo();
  await connect(port);
};

const updateArduino = () => {
  const dataToSend = { m: margeScore, h: homerScore };
  writer.write(JSON.stringify(dataToSend) + '\n');
};

let startTime;
let countdownInterval;

/* ----------- PING DISTANCE SENSOR ------- */
const getTime = () => {
  let newDate = new Date();
  return newDate.getSeconds();
};

const resetTimer = () => {
  clearInterval(countdownInterval);
  countdownInterval = null;
};

const setTime = () => {
  startTime = getTime();
};

const checkTime = () => {
  const currentTime = getTime();
  const timer = 4; //delay of 4
  const difference = Math.abs(currentTime - startTime);
  const isReady = difference > timer;
  // Use this log as an example for the timer
  console.log(timer - difference);

  //display timer
  const displayTimeRemaining = timer - difference;

  const displayCountdownContainer = document
    .querySelector('.countdown__countainer')
    .classList.remove('visibility');
  document.getElementById('countdown__display').textContent =
    displayTimeRemaining; //difference; //display countdown

  //return isReady;
  return displayTimeRemaining <= 0;

  //if (isReady && difference < timer + 1) {
  //  return true;
  //}
  //return Math.abs(Math.abs(startTime - 60) - currentTime) > timer;
};

//handle logic for sending data to arduino
const receiveDataFromArduino = async (port) => {
  //lineBreakTransformer is part of the transforming part
  // new text transform stream => new line break transformer
  // it processes that data stream while it's coming in and chunking it into pieces that are determined by the new line characters
  const lineBreakTransformer = new TransformStream({
    transform(chunk, controller) {
      const text = chunk;
      const lines = text.split('\n');
      lines[0] = (this.remainder || '') + lines[0];
      this.remainder = lines.pop();
      lines.forEach((line) => controller.enqueue(line));
    },
    flush(controller) {
      if (this.remainder) {
        controller.enqueue(this.remainder);
      }
    },
  });

  setTime();

  while (port.readable) {
    const decoder = new TextDecoderStream(); 
    const readableStreamClosed = port.readable.pipeTo(decoder.writable);
    const inputStream = decoder.readable.pipeThrough(lineBreakTransformer);
    const reader = inputStream.getReader();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // |reader| has been canceled.
          break;
        }
        try {
          const parsedJson = JSON.parse(value);
          hoverAnswer(parsedJson);
          if (checkTime()) {
            processAnswer(parsedJson);
          }
          console.log(parsedJson);
        } catch (e) {
          //console.log(e);
        }
      }
    } catch (error) {
    } finally {
      reader.releaseLock();
    }
  }
};

const hoverAnswer = (json) => {
  const selectedColor = '#fbd239';
  const baseColor = '#DE5893'; 

  if (json.sensor === 'ping') {
    if (json.buttonUp) {
      $chooseAnswerB.style.backgroundColor = baseColor;
      $chooseAnswerA.style.backgroundColor = selectedColor;
      setTimeout(() => {
        $chooseAnswerA.style.backgroundColor = baseColor;
      }, 1000);
    } else if (json.buttonDown) {
      console.log('button down');
      $chooseAnswerB.style.backgroundColor = selectedColor;
      $chooseAnswerA.style.backgroundColor = baseColor;
      setTimeout(() => {
        $chooseAnswerB.style.backgroundColor = baseColor;
      }, 1000);
    }
  }
};

const processAnswer = (json) => {
  const baseColor = '#DE5893'; 
  const selectedColor = '#fbd239';
  console.log(json);
  if (json.sensor === 'ping') {
    console.log(json.data);
    if (json.buttonUp) {
      $chooseAnswerA.style.backgroundColor = baseColor;
      $chooseAnswerA.dispatchEvent(new Event('click'));
    } else if (json.buttonDown) {
      $chooseAnswerB.style.backgroundColor = baseColor;
      $chooseAnswerB.dispatchEvent(new Event('click'));
    }
  }
};


/* ----------- SERVO SENSOR ----------- */

//Process data from Arduino & update UI
const processJson = (json) => {
  console.log(json);
  if (json.sensor === 'ping') {
    console.log(json.data);
    if (json.buttonUp) {
      console.log('button up');
      $chooseAnswerB.style.backgroundColor = '#059a93';
      $chooseAnswerA.dispatchEvent(new Event('click'));
      $chooseAnswerA.addEventListener('click', handleSelectAnswer);
      $chooseAnswerA.style.backgroundColor = '#059a93';
    } else if (json.buttonDown) {
      console.log('button down');
      $chooseAnswerB.style.backgroundColor = '#fbd239';
      $chooseAnswerA.style.backgroundColor = '#059a93';
      $chooseAnswerB.dispatchEvent(new Event('click'));
      $chooseAnswerB.addEventListener('click', handleSelectAnswer);
    }
  }
};

const connect = async (port) => {
  isConnected = true;
  displayConnectionState();
  console.log('connection works? const connect');

  await port.open({ baudRate: 9600 });

  if (port) {
    receiveDataFromArduino(port); 
    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    writer = textEncoder.writable.getWriter();

    updateArduino(); //update scores

    port.addEventListener('disconnect', () => {
      console.log('Disconnected');
      isConnected = false;
      displayConnectionState();
      window.alert(
        'You are disconnected from the Arduino. Please reconnect or continue on screen without it.'
      );
    });
  }
};

const displaySupportedState = () => {
  if (hasWebSerial) {
    $notSupported.style.display = 'none';
    $supported.style.display = 'block';
  } else {
    $notSupported.style.display = 'block';
    $supported.style.display = 'none';
  }
};

const displayConnectionState = () => {
  if (isConnected) {
    $notConnected.style.display = 'none';
    $connected.style.display = 'block';
    $connectButton.style.display = 'none';
  } else {
    $notConnected.style.display = 'block';
    $connected.style.display = 'none';
    $connectButton.style.display = 'block';
  }
};

/*=======================================
          4. QUIZ LOGIC 
    =========================================*/

let storeAnswersArray = [];
let margeScore = 0;
let homerScore = 0;

let questionNumber = 0;

const questionsArray = [
  {
    question: '1. Which food do you prefer',
    optionOne: 'Burgers',
    optionTwo: 'Buttered Noodles',
    correctAnswer: 'Buttered Noodles',
  },
  {
    question: '2. Which activity do you prefer',
    optionOne: 'Pursue a hobby',
    optionTwo: 'Watching TV',
    correctAnswer: 'Pursue a hobby',
  },
  {
    question: '3. Which drink do you prefer?',
    optionOne: 'Beer',
    optionTwo: 'Tea',
    correctAnswer: 'Tea',
  },
  {
    question: '4. Which food do you prefer',
    optionOne: 'Burgers',
    optionTwo: 'Buttered Noodles',
    correctAnswer: 'Buttered Noodles',
  },
  {
    question: '5. Which activity do you prefer',
    optionOne: 'Pursue a hobby',
    optionTwo: 'Watching TV',
    correctAnswer: 'Pursue a hobby',
  },
];

const handleSelectAnswer = (e) => {
  const currentAnswer = e.target.textContent;
  calculateScores(currentAnswer);
  showNextQuestion();
};


const showNextQuestion = () => {
  if (questionNumber < questionsArray.length) {
    const currentQuestion = questionsArray[questionNumber];
    $questionElement.textContent = currentQuestion.question;
    $chooseAnswerA.textContent = currentQuestion.optionOne;
    $chooseAnswerB.textContent = currentQuestion.optionTwo;
    questionNumber++;
    setTime();
  } else {
    showFinalContainer();
  }
};

const calculateScores = async (selectedAnswer) => {
  const $displayMargeWebcam = document.querySelector('.img__video--marge');
  const $displayHomerWebcam = document.querySelector('.img__video--homer');
  const currentQuestion = questionsArray[questionNumber - 1];
  const correctAnswer = currentQuestion.correctAnswer;

  if (selectedAnswer === correctAnswer) {
    margeScore++;
    $displayMargeWebcam.classList.remove('hidden');
    setTimeout(() => {
      $displayMargeWebcam.classList.add('hidden');
    }, 4000);
  } else {
    homerScore++;
    $displayHomerWebcam.classList.remove('hidden');
    setTimeout(() => {
      $displayHomerWebcam.classList.add('hidden');
    }, 4000);
  }

  displayScores();

  try {
    updateArduino();
  } catch (error) {
    //console.log('arduino error', error);
  }
};


const refreshQuiz = () => {
  window.location.reload();
};

const showFinalContainer = () => {
  $questionsContainer.classList.add(`visibility`);
  $resultContainer.classList.remove(`visibility`);
  $scoreSection.classList.add(`hidden`);
  $video.style.width = '35rem';
  $otherVideo.style.width = '35rem';
  document.querySelector('.video__container').style.width = '35rem';
  document
    .querySelector('.result__title')
    .classList.add('result__title--friend'); 
  $btnRetakeQuiz.classList.remove(`hidden`);
  $btnRetakeQuiz.addEventListener(`click`, refreshQuiz);
  let result;

  if (margeScore > homerScore) {
    result = 'Marge';
    document.querySelector('.result__title').textContent = `${result} Simpsons`;
    document.getElementById('finalImgLocal').src = `./assets/${result}.png`;
    document.getElementById('finalImgLocal').alt = `${result} Simpsons`;
  } else {
    result = 'Homer';
    document.querySelector('.result__title').textContent = `${result} Simpsons`;
    document.getElementById('finalImgLocal').src = `./assets/${result}.png`;
    document.getElementById('finalImgLocal').alt = `${result} Simpsons`;
  }

  if (peer) {
    $finalResultRemote.classList.remove('hidden');
    $resultContainer.classList.remove(`visibility`);
    const data = {
      type: 'showFinalResult',
      result: result,
    };
    peer.send(JSON.stringify(data));
  }

  if (!peer) {
    document.querySelector('.btn--solo').classList.remove('hidden');
    document.querySelector('.btn--solo').addEventListener(`click`, refreshQuiz);
  }
};

const showResultMarge = () => {
  $resultTitle.textContent = 'Marge Simpson';
  $resultText.textContent = 'You are more like Marge Simpson!';
  $resultSecondText.textContent =
    "You're responsible, caring, and always trying to do what's best for your family.";
  $questionsContainer.classList.add('hidden');
};

const showResultHomer = () => {
  $resultTitle.textContent = 'Homer Simpson';
  $resultText.textContent = "You're more like Homer Simpson!";
  $resultSecondText.textContent =
    "You're easygoing, laidback, and always looking for a good time.";
  $questionsContainer.classList.add('hidden');
};


const displayScores = () => {
  $margeCount.textContent = margeScore;
  $homerCount.textContent = homerScore;

  if (peer) {
    const data = {
      type: 'updateScore',
      margeScore: margeScore,
      homerScore: homerScore,
    };
    peer.send(JSON.stringify(data));
  }
};



const $screenName = document.querySelector('.start__name');
const $nameForm = document.getElementById('nameForm');

const $nameError = $screenName.querySelector('.error');
const $myName = document.querySelector('.video__myname');

const handleSubmitName = (event) => {
  event.preventDefault();
  if ($nameInput.value) {
    socket.emit('name', $nameInput.value);
    $myName.innerHTML = $nameInput.value;
  }
};

const sendMyName = () => {
  try {
    const data = {
      type: 'updateName',
      name: $myName.innerHTML,
    };
    peer.send(JSON.stringify(data));
  } catch (e) {
    //console.log(e);
  }
};

//Generic function for receiving elements if I have multiple screens
const showScreen = ($screen) => {
  $screenName.classList.toggle('screen--visible', $screen === $screenName);
};

const init = async () => {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    $video.srcObject = myStream;

    $otherSocketIds.addEventListener('input', callSelectedPeer);
    $video.onloadedmetadata = () => $video.play();
  } catch (error) {
    console.log(error);
    $video.style.backgroundColor = 'white';
    $video.style.backgroundImage = 'url(./assets/doughnut.png)';
    $video.style.backgroundRepeat = 'no-repeat';
  }
  initSocket();

  /* ---------   ARDUINO   --------- */
  displaySupportedState();
  if (!hasWebSerial) return;
  displayConnectionState();

  navigator.serial.addEventListener('connect', (e) => {
    const port = e.target;
    const info = port.getInfo();
    if (isArduinoPort(port)) {
      connectedArduinoPorts.push(port);
      if (!isConnected) {
        connect(port);
      }
    }
  });

  navigator.serial.addEventListener('disconnect', (e) => {
    const port = e.target;
    const info = port.getInfo();
    connectedArduinoPorts = connectedArduinoPorts.filter(
      (portValue) => portValue !== port
    );
  });

  const ports = await navigator.serial.getPorts();
  connectedArduinoPorts = ports.filter(isArduinoPort);

  ports.forEach((port) => {
    const info = port.getInfo();
  });

  connectedArduinoPorts.forEach((port) => {
    const info = port.getInfo();
  });

  if (connectedArduinoPorts.length > 0) {
    connect(connectedArduinoPorts[0]);
  }

  $connectButton.addEventListener('click', handleClickConnect);


  /* ========  QUIZ STARTS HERE ========  */
  displayScores();
  showNextQuestion();

  $chooseAnswerA.addEventListener('click', handleSelectAnswer);
  $chooseAnswerB.addEventListener('click', handleSelectAnswer);



/* ========  ONBOARDING  ========  */ 
  updateUserInterface();
};

/* ========  SocketIO  ========  */ 
const socketURL = '/';

const initSocket = () => {
  socket = io.connect(socketURL);

  socket.on('connect', () => {
    console.log(socket.id);
  });

  socket.on('clients', (clients) => {
    updatePeerList(clients);
  });

  socket.on('signal', async (myId, signal, peerId) => {
    if (signal.type === 'offer' && !peer) {
      await handlePeerOffer(myId, signal, peerId);
    }
    peer.signal(signal);
  });

  socket.on('client-disconnect', (socketId) => {
    connectedPeerId == socketId;
    if (peer) {
      peer.destroy();
      peer = null;
      window.alert(
        'Oh no your friend has left!  You can still continue without him, or refresh to connect with a new friend. '
      );
      $userContainer.classList.add('visibility');
    }
  });

  socket.on('name', (clients) => {
    updatePeerList(clients);
  });
};

const updatePeerList = (clients) => {
  $otherSocketIds.innerHTML =
    '<option value="none">--- Select Friend To Call ---</option>';
  for (const otherSocketId in clients) {
    if (clients.hasOwnProperty(otherSocketId)) {
      const otherClient = clients[otherSocketId];
      if (otherClient.id !== socket.id) {
        const $option = document.createElement('option');
        $option.value = otherClient.id;
        $option.textContent = otherClient.name || otherClient.id;
        $otherSocketIds.appendChild($option);
      }
    }
  }
};

/* ========  WebRTC / Simple Peer  ========  */ 
const callSelectedPeer = () => {
  if ($otherSocketIds.value === '') {
    return;
  }
  callPeer($otherSocketIds.value);
};

const callPeer = async (peerId) => {
  peer = new SimplePeer({
    initiator: true,
    stream: myStream,
    channelConfig: {
      ordered: false,
      maxRetransmits: 0,
      channelName: 'data',
    },
  });
  connectedPeerId = peerId;
  peer.on('signal', (signal) => {
    socket.emit('signal', peerId, signal);
  });

  peer.on('stream', (stream) => {
    $otherVideo.srcObject = stream;
  });

  peer.on('close', () => {
    peer.destroy();
    peer = null;
    $userContainer.classList.add('visibility');
  });

  peer.on('error', () => {
    console.log('error');
  });

  peer.on('connect', () => {
    $userContainer.classList.remove('visibility');
  });

  //Caller / initiator
  peer.on('data', (data) => {
    try {
      data = JSON.parse(data);
      if (data.type === 'updateScore') {
        $scoreUserHomer.innerHTML = data.homerScore;
        $scoreUserMarge.innerHTML = data.margeScore;
      } else if (data.type === 'showFinalResult') {
        $finalRemoteText.textContent = `${data.result} Simpsons`;
        document.getElementById(
          'finalImgExternal'
        ).src = `./assets/${data.result}.png`;
        document.getElementById(
          'finalImgExternal'
        ).alt = `${data.result} Simpsons`;
        $otherVideo.classList.remove('hidden');
        $finalRemoteText.classList.add('result__final--friend');
        $resultTitle.classList.add('result__title--friend');
        document.querySelector('.remote__name').classList.remove('hidden');
      } else if (data.type === 'updateName') {
        const otherUserName = data.name; 
        const $otherUserElement = document.querySelector('.scores__other--user');
        $otherUserElement.textContent = otherUserName;
        document.querySelector('.remote__name').textContent = otherUserName;
      }
    } catch (e) {
      console.log(e);
    }
  });
};

const handlePeerOffer = async (myPeerId, offer, peerId) => {
  peer = new SimplePeer({
    initiator: false,
    stream: myStream,
    channelConfig: {
      ordered: false,
      maxRetransmits: 0,
      channelName: 'data',
    },
  });
  connectedPeerId = peerId;
  peer.on('signal', (signal) => {
    socket.emit('signal', peerId, signal);
  });

  peer.on('stream', (stream) => {
    $otherVideo.srcObject = stream;
  });

  peer.on('close', () => {
    peer.destroy();
    peer = null;
    $userContainer.classList.add('visibility');
    $otherVideo.classList.add('hidden');
  });

  peer.on('connect', () => {
    $userContainer.classList.remove('visibility');
  });

  /* receiver*/
  peer.on('data', (data) => {
    try {
      data = JSON.parse(data);
      if (data.type === 'updateScore') {
        $scoreUserHomer.innerHTML = data.homerScore;
        $scoreUserMarge.innerHTML = data.margeScore;
      } else if (data.type === 'showFinalResult') {
        $finalRemoteText.textContent = `${data.result} Simpsons`;
        document.getElementById('finalImgExternal').src = `${data.result == 'Homer' ? './assets/Homer.png' : './assets/Marge.png'}`;
        document.getElementById('finalImgExternal').alt = `${data.result} Simpsons`;
        $finalRemoteText.classList.add('result__final--friend'); 
        $resultTitle.classList.add('result__title--friend');
        $otherVideo.classList.remove('hidden');
        document.querySelector('.remote__name').classList.remove('hidden');
      } else if (data.type === 'updateName') {
        const otherUserName = data.name; 
        const $otherUserElement = document.querySelector('.scores__other--user');
        $otherUserElement.textContent = otherUserName;
        document.querySelector('.remote__name').textContent = otherUserName;
      }
    } catch (e) {
      console.log(e);
    }
  });
};

init();
