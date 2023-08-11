/*=======================================
          1. Onboarding
    =========================================*/

const $tutorialContainer = document.querySelector('.tutorial__container');
const $gameContainer = document.getElementById('game__container');

const hideGame = () => {
  $tutorialContainer.style.display = 'flex';
  $gameContainer.style.display = 'none';
};

let stepNumber = 0;
let usernameValue = '';

const setUserConfiguration = () => {
  const $username = document.getElementById('nameInput');
  const $usernameContainer = document.querySelector(
    '.tutorial__username__container'
  );
  const $tutorailConnectContainer = document.querySelector(
    '.tutorial__connect__container'
  );
  const $tutorialTutorialContainer = document.querySelector(
    '.tutorial__tutorial__container'
  );

  if (stepNumber === 0) {
    usernameValue = $username.value;
    stepNumber++;
    $tutorailConnectContainer.style.display = 'none';
    $tutorialTutorialContainer.style.display = 'none';
    $usernameContainer.style.display = 'flex';
    handleSubmitName();
  } else if (stepNumber === 1) {
    stepNumber++;
    $tutorailConnectContainer.style.display = 'flex';
    $tutorialTutorialContainer.style.display = 'none';
    $usernameContainer.style.display = 'none';
  } else if (stepNumber === 2) {
    stepNumber++;
    $tutorailConnectContainer.style.display = 'none';
    $tutorialTutorialContainer.style.display = 'flex';
    $usernameContainer.style.display = 'none';
  } else {
    $tutorialContainer.style.display = 'none';
    $gameContainer.style.display = 'flex';
  }
};

/*=======================================
          1. Start Game 
    =========================================*/

const $video = document.getElementById('myVideo');
const $otherVideo = document.getElementById('otherVideo');
const $otherSocketIds = document.getElementById('otherSocketIds');

let socket;
let peer;
let connectedPeerId;
let myStream;
let peerId;

// Data/ testing -> my code

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

/**/
//const $scoreRemote = document.querySelector(`.remote__score`);
const $userContainer = document.querySelector(`.container__users`);
const $scoreUserHomer = document.querySelector(`.user__score--homer`);
const $scoreUserMarge = document.querySelector(`.user__score--marge`);

const $finalResultRemote = document.querySelector('.showResult--remote');
const $finalRemoteText = document.querySelector('.result__final');

/**/

//arduino starts here
/*=======================================
          1. Arduino 
    =========================================*/
const hasWebSerial = 'serial' in navigator;
let isConnected = false; // state of the serial connection to the Arduino

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
  console.log(port);
  const info = port.getInfo();
  console.log(info);
  await connect(port);
};

//was getting error that port was not defined, so added it as a parameter
const updateArduino = (/*port*/) => {
  //  if (port) {
  const dataToSend = { m: margeScore, h: homerScore };
  writer.write(JSON.stringify(dataToSend) + '\n');

  console.log(dataToSend, 'send data ');
  console.log('update arduino works?');
  //  }
};

let startTime;

const getTime = () => {
  let newDate = new Date();
  return newDate.getSeconds();
};

const setTime = () => {
  startTime = getTime();
};

const checkTime = () => {
  const currentTime = getTime();
  const timer = 6; //delay of 4
  const difference = Math.abs(currentTime - startTime);
  const isReady = difference > timer;
  // Use this log as an example for the timer
  console.log(timer - difference);
  document.getElementById('countdown__display').textContent = difference; //display countdown

  return isReady;

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
    const decoder = new TextDecoderStream(); //text de-coder stream - converst values to a string
    const readableStreamClosed = port.readable.pipeTo(decoder.writable);
    const inputStream = decoder.readable.pipeThrough(lineBreakTransformer);
    const reader = inputStream.getReader(); // this will add the transforming step to our stream

    // const reader = port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // |reader| has been canceled.
          break;
        }
        // Do something with |value|...
        try {
          const parsedJson = JSON.parse(value);
          console.log('value : ', value);
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
      // Handle |error|...
    } finally {
      reader.releaseLock();
    }
  }
};

const hoverAnswer = (json) => {
  const selectedColor = '#fbd239';
  const baseColor = '#059a93';

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
  const baseColor = '#059a93';
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

// Global variables to store the current hover status
//let isButtonUpHovered = false;
//let isButtonDownHovered = false;

//Json data from arduino -> process it and update UI (called in receiveDataFromArduino)
const processJson = (json) => {
  console.log(json);
  if (json.sensor === 'ping') {
    console.log(json.data);
    if (json.buttonUp) {
      console.log('button up');
      $chooseAnswerB.style.backgroundColor = '#059a93';
      //dispatch click after 5 seconds

      $chooseAnswerA.dispatchEvent(new Event('click'));
      $chooseAnswerA.addEventListener('click', handleSelectAnswer);
      $chooseAnswerA.style.backgroundColor = '#059a93';
    } else if (json.buttonDown) {
      console.log('button down');
      $chooseAnswerB.style.backgroundColor = '#fbd239';
      $chooseAnswerA.style.backgroundColor = '#059a93';
      //dispatch click after 5 seconds

      $chooseAnswerB.dispatchEvent(new Event('click'));
      $chooseAnswerB.addEventListener('click', handleSelectAnswer);
      /*  $chooseAnswerB.style.backgroundColor = '#059a93'; */
    }
  }
};

const connect = async (port) => {
  isConnected = true;
  displayConnectionState();
  console.log('connection works? const connect');

  await port.open({ baudRate: 9600 });

  if (port) {
    receiveDataFromArduino(port); //handles the logic for receiving data from arduino
    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    writer = textEncoder.writable.getWriter();

    /*Update score -> reset the servo */
    updateArduino();

    //if is disconnected, update UI
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
          2. QUIZ LOGIC 
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
  console.log('handle select answer works');

  //send the selected answer to the other peer -> don't need this, but keep for now
  if (peer) {
    const data = {
      type: 'updateQuestion',
      selectedAnswer: currentAnswer,
    };
    peer.send(JSON.stringify(data));
  }
};

/* quiz - desktop front */

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
    console.log('arduino error', error);
  }
};

//
const refreshQuiz = () => {
  window.location.reload();
};
//
const showFinalContainer = () => {
  $questionsContainer.classList.add(`visibility`);
  $resultContainer.classList.remove(`visibility`);
  $scoreSection.classList.add(`hidden`);
  $video.style.width = '35rem';
  $otherVideo.style.width = '35rem';
  document.querySelector('.video__container').style.width = '35rem';

  // $img__simpsons.classList.add(`hidden`);

  $btnRetakeQuiz.classList.remove(`hidden`);
  $btnRetakeQuiz.addEventListener(`click`, refreshQuiz);
  let result;

  if (margeScore > homerScore) {
    result = 'Marge';
    document.querySelector('.result__title').textContent = `${result} Simpsons`;
    document.getElementById('finalImgLocal').src = `./assets/${result}.png`;
    document.getElementById('finalImgLocal').alt = `${result} Simpsons`;
    //    showResultMarge();
  } else {
    result = 'Homer';
    document.querySelector('.result__title').textContent = `${result} Simpsons`;
    document.getElementById('finalImgLocal').src = `./assets/${result}.png`;
    document.getElementById('finalImgLocal').alt = `${result} Simpsons`;
    //    showResultHomer();
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
//
const showResultHomer = () => {
  $resultTitle.textContent = 'Homer Simpson';
  $resultText.textContent = "You're more like Homer Simpson!";
  $resultSecondText.textContent =
    "You're easygoing, laidback, and always looking for a good time.";
  $questionsContainer.classList.add('hidden');
};

//
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

// ends
/**/

const $screenName = document.querySelector('.start__name');
const $nameForm = document.getElementById('nameForm');
const $nameInput = document.getElementById('nameInput');
const $nameError = $screenName.querySelector('.error');

const handleSubmitName = (event) => {
  // event.preventDefault();
  if ($nameInput.value) {
    socket.emit('name', $nameInput.value);
  }
};
//If I'm going to have multiple screens = good idea to have generic function that receives elements to show
const showScreen = ($screen) => {
  $screenName.classList.toggle('screen--visible', $screen === $screenName);
};

const init = async () => {
  myStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  $video.srcObject = myStream;
  initSocket();

  $otherSocketIds.addEventListener('input', callSelectedPeer);
  $video.onloadedmetadata = () => $video.play();

  /* ---------   ARDUINO   --------- */
  displaySupportedState();
  if (!hasWebSerial) return;
  displayConnectionState();
  //connect handler:
  navigator.serial.addEventListener('connect', (e) => {
    const port = e.target;
    const info = port.getInfo();
    console.log('connect', port, info);
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
    console.log('disconnect', port, info);
    connectedArduinoPorts = connectedArduinoPorts.filter(
      (portValue) => portValue !== port
    );
  });
  const ports = await navigator.serial.getPorts();
  connectedArduinoPorts = ports.filter(isArduinoPort);

  console.log('Ports');
  ports.forEach((port) => {
    const info = port.getInfo();
    console.log(info);
  });
  console.log('Connected Arduino ports');
  connectedArduinoPorts.forEach((port) => {
    const info = port.getInfo();
    console.log(info);
  });

  if (connectedArduinoPorts.length > 0) {
    connect(connectedArduinoPorts[0]);
  }

  $connectButton.addEventListener('click', handleClickConnect);
  /*ARDUINO STOPS HERE */

  //onboarding
  setUserConfiguration();

  /* ========  QUIZ STARTS HERE ========  */

  displayScores(); //update score
  showNextQuestion(); //update question

  $chooseAnswerA.addEventListener('click', handleSelectAnswer);
  $chooseAnswerB.addEventListener('click', handleSelectAnswer);
  /*  handleSelectAnswer(e); */
  console.log($chooseAnswerB, 'choose answer B works');
  console.log($chooseAnswerA, 'choose answer A works');

  // usersScoreList(); //update user score list
};

const socketURL = 'http://localhost:8443';

const initSocket = () => {
  socket = io.connect('/');

  socket.on('connect', () => {
    console.log(socket.id);
  });

  socket.on('clients', (clients) => {
    console.log(clients);
    updatePeerList(clients);
  }); //create the html for the list of peers

  socket.on('signal', async (myId, signal, peerId) => {
    console.log(`Received signal from ${peerId}`);
    console.log(signal);
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
    }
  });

  socket.on('name', (client) => {
    console.log('you are now named', client.name);
    //$screenName.classList.remove('screen--visible');
    // showScreen($screenName);
  });

  //$nameForm.addEventListener('submit', event => { handleSubmitName(event); });
};

/*form -start*/
//const $form = document.getElementById('myForm');
//const $resultDiv = document.getElementById('result');
// $form.addEventListener('submit', (event) => {
//   event.preventDefault(); // Prevent form submission to avoid page reload

//const $nameInput = document.getElementById('name');
//const name = $nameInput.value;

// Display the value on the page
//  $option.textContent = `Your name is: ${name}`;
//  updatePeerList(name);
// });

const updatePeerList = (clients) => {
  console.log(clients);
  console.log(clients.name);

  $otherSocketIds.innerHTML =
    '<option value="none">--- Select Peer To Call ---</option>';
  for (const otherSocketId in clients) {
    //const isMyOwnId = (clientId === socket.id);
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

const callSelectedPeer = () => {
  if ($otherSocketIds.value === '') {
    return;
  }
  console.log(`Call the selected peer: ${$otherSocketIds.value} `);
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
    console.log('closed');
    peer.destroy();
    peer = null;
    $userContainer.classList.add('visibility');
  });

  peer.on('error', () => {
    console.log('error');
  });

  /*testing*/
  /* So once I connect to someone, I could update here some visuals and stuff!
      Connect => The callee
      Data => Callee receives from receiver*/
  peer.on('connect', () => {
    //peer.send('hello threre!');
    console.log('hello'); //see this on callee side

    $userContainer.classList.remove('visibility');
    //send the name? -> callee receives the receivers name and displays it along with score count on the screen
  });

  peer.on('data', (data) => {
    console.log('got a message from the other peer: ' + data); //received back from the other peer!

    try {
      data = JSON.parse(data);
      if (data.type === 'updateScore') {
        console.log(data.score);
        $scoreUserHomer.innerHTML = data.homerScore;
        $scoreUserMarge.innerHTML = data.margeScore;
      } else if (data.type === 'showFinalResult') {
        console.log(data.resuslt);
        console.log('finalResult container should be visible');
        $finalRemoteText.textContent = `${data.result} Simpsons`;
        document.getElementById(
          'finalImgExternal'
        ).src = `./assets/${data.result}.png`;
        document.getElementById(
          'finalImgExternal'
        ).alt = `${data.result} Simpsons`;
        $otherVideo.classList.remove('hidden');

        console.log('show result marge works');
        console.log(data);
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
    console.log('closed');
    peer.destroy();
    peer = null;
    $userContainer.classList.add('visibility');
    $otherVideo.classList.add('hidden');
  });

  peer.on('connect', () => {
    $userContainer.classList.remove('visibility');
  });

  /*could update css here for the receiver side - on connect, execute*/
  peer.on('data', (data) => {
    console.log('got a message from the callee?? ' + data); //receive from the callee on 'conncet'.

    //display the received score

    //Removed from html : $scoreRemote.textContent = JSON.parse(data).selectedAnswer;

    // let dataParsed = JSON.parse(data);
    //usersScoreList(dataParsed.score);

    //show scores from the other peer(the recevier)
    try {
      data = JSON.parse(data);
      if (data.type === 'updateScore') {
        console.log(data.score);
        $scoreUserHomer.innerHTML = data.homerScore;
        $scoreUserMarge.innerHTML = data.margeScore;
      } else if (data.type === 'showFinalResult') {
        console.log('is it homer or marge', data.result);
        //  if (data.result === 'Marge') {
        //$finalResultRemote.classlist.remove('hidden');
        $finalRemoteText.textContent = `${data.result} Simpsons`;
        document.getElementById(
          'finalImgExternal'
        ).src = `./assets/${data.result}.png`;
        document.getElementById(
          'finalImgExternal'
        ).alt = `${data.result} Simpsons`;
        $otherVideo.classList.remove('hidden');

        console.log('show result marge works');
        console.log(data);
      }
    } catch (e) {
      console.log(e);
    }
  });
};

init();
