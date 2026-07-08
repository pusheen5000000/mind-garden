/* ===== Help Kitty Think — game logic =====
   Drop your own art into games/thinking-errors/images/ named:
     cat-0.png ... cat-5.png   (6 cat sprites, sad -> happy)
     locked.png, unlocked.png (thought-bubble lock icons)
*/

(() => {
  // The 6 thinking errors, adapted from the reference sheet.
  // Each has a short kid-friendly description used as the "correct" quiz answer.
  const THINKING_ERRORS = [
    {
      name: 'Negative Glasses',
      description: 'Only seeing the things that go wrong, while anything good gets overlooked or ignored.',
    },
    {
      name: 'Blowing Things Up',
      description: 'Taking something negative and making it seem much bigger and worse than it really is.',
    },
    {
      name: 'Blame Me!',
      description: 'Feeling responsible for bad things that happen, even when you had little or no control over them.',
    },
    {
      name: '"Should" and "Must" Statements',
      description: 'Setting standards or expectations for yourself that are so high they are almost impossible to reach.',
    },
    {
      name: 'Mind Reading and Fortune Telling',
      description: 'Assuming you know what other people are thinking, or deciding something bad will happen before it does.',
    },
    {
      name: 'All-or-Nothing Thinking',
      description: 'Seeing everything as either perfect or a total failure, with nothing in between.',
    },
  ];

  const TOTAL = THINKING_ERRORS.length;
  const CAT_SPRITE_COUNT = 6; // cat-0.png (sad) ... cat-5.png (happy)

  // Cycles through after every correct answer, above the cat.
  const ENCOURAGEMENTS = ['Great job!', 'Good work!', 'Kitty is understanding!', 'Kitty is feeling better!', 'Amazing job!', 'You did it!'];
  const HEART_COUNT_PER_PET = 5;

  const kittyStage = document.getElementById('kitty-stage');
  const bubbleRow = document.getElementById('bubble-row');
  const catWrap = document.getElementById('cat-wrap');
  const catSprite = document.getElementById('cat-sprite');
  const progressText = document.getElementById('progress-text');
  const encourageText = document.getElementById('encourage-text');

  const quizOverlay = document.getElementById('quiz-overlay');
  const quizTitle = document.getElementById('quiz-title');
  const optionA = document.getElementById('option-a');
  const optionB = document.getElementById('option-b');
  const quizFeedback = document.getElementById('quiz-feedback');

  const finishOverlay = document.getElementById('finish-overlay');
  const finishMessage = document.getElementById('finish-message');
  const petKittyBtn = document.getElementById('pet-kitty-btn');
  const strategiesBtn = document.getElementById('strategies-btn');
  const strategiesList = document.getElementById('strategies-list');

  let pettingMode = false;
  let encourageTimer = null;

  let currentIndex = 0; // index of the active (unlocked, unsolved) bubble
  let bubbles = [];

  function buildBubbles() {
    THINKING_ERRORS.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'thought-bubble';

      const icon = document.createElement('img');
      icon.className = 'bubble-icon';
      icon.alt = i === 0 ? 'Unlocked thought bubble' : 'Locked thought bubble';
      btn.appendChild(icon);

      btn.addEventListener('click', () => {
        if (btn.classList.contains('locked') || btn.classList.contains('solved')) return;
        openQuiz(i);
      });

      bubbleRow.appendChild(btn);
      bubbles.push(btn);
    });

    updateBubbles();
  }

  function updateBubbles() {
    bubbles.forEach((btn, i) => {
      const icon = btn.querySelector('.bubble-icon');

      if (i < currentIndex) {
        btn.classList.add('solved');
        btn.classList.remove('active', 'locked');
      } else if (i === currentIndex) {
        btn.classList.remove('locked');
        btn.classList.add('active');
        icon.src = 'images/unlocked.png';
        icon.alt = 'Unlocked thought bubble';
      } else {
        btn.classList.add('locked');
        btn.classList.remove('active');
        icon.src = 'images/locked.png';
        icon.alt = 'Locked thought bubble';
      }
    });

    progressText.textContent = `Thought bubbles solved: ${currentIndex} / ${TOTAL}`;
  }

  function updateCatSprite() {
    const spriteIndex = Math.min(currentIndex, CAT_SPRITE_COUNT - 1);
    catSprite.src = `images/cat-${spriteIndex}.png`;
  }

  function showEncouragement(solvedCount) {
    const message = ENCOURAGEMENTS[(solvedCount - 1) % ENCOURAGEMENTS.length];
    encourageText.textContent = message;
    encourageText.classList.add('show');

    clearTimeout(encourageTimer);
    encourageTimer = setTimeout(() => {
      encourageText.classList.remove('show');
    }, 1600);
  }

  let activeQuestionIndex = null;

  function openQuiz(index) {
    activeQuestionIndex = index;
    const errorData = THINKING_ERRORS[index];

    // Pick a distractor description from a different thinking error.
    let wrongPoolIndex;
    do {
      wrongPoolIndex = Math.floor(Math.random() * TOTAL);
    } while (wrongPoolIndex === index);
    const wrongDescription = THINKING_ERRORS[wrongPoolIndex].description;

    quizTitle.textContent = `What is "${errorData.name}"?`;

    const correctFirst = Math.random() < 0.5;
    const optionAData = correctFirst
      ? { text: errorData.description, correct: true }
      : { text: wrongDescription, correct: false };
    const optionBData = correctFirst
      ? { text: wrongDescription, correct: false }
      : { text: errorData.description, correct: true };

    optionA.textContent = optionAData.text;
    optionA.dataset.correct = optionAData.correct;
    optionB.textContent = optionBData.text;
    optionB.dataset.correct = optionBData.correct;

    [optionA, optionB].forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove('incorrect');
    });
    quizFeedback.hidden = true;

    quizOverlay.hidden = false;
  }

  function handleOptionClick(btn) {
    const isCorrect = btn.dataset.correct === 'true';

    if (isCorrect) {
      quizOverlay.hidden = true;
      currentIndex += 1;
      updateBubbles();
      updateCatSprite();
      showEncouragement(currentIndex);

      if (currentIndex >= TOTAL) {
        setTimeout(() => {
          finishOverlay.hidden = false;
        }, 300);
      }
    } else {
      btn.classList.add('incorrect');
      btn.disabled = true;
      quizFeedback.hidden = false;
    }
  }

  optionA.addEventListener('click', () => handleOptionClick(optionA));
  optionB.addEventListener('click', () => handleOptionClick(optionB));

  // ===== Pet Kitty mode (after the game is finished) =====
  // Cursor becomes a glove, hovering the cat grows it slightly, and
  // clicking gives a happy little bounce plus a burst of hearts.

  function spawnHeartsFromCat() {
    const catRect = catSprite.getBoundingClientRect();
    const stageRect = kittyStage.getBoundingClientRect();
    const originX = catRect.left - stageRect.left + catRect.width / 2;
    const originY = catRect.top - stageRect.top + catRect.height * 0.15;

    for (let i = 0; i < HEART_COUNT_PER_PET; i++) {
      const heart = document.createElement('img');
      heart.src = 'images/heart.png';
      heart.alt = '';
      heart.className = 'floating-heart';

      const drift = (Math.random() - 0.5) * 140;
      const rotate = (Math.random() - 0.5) * 50;
      heart.style.left = `${originX - 14}px`;
      heart.style.top = `${originY}px`;
      heart.style.setProperty('--drift', `${drift}px`);
      heart.style.setProperty('--rot', `${rotate}deg`);
      heart.style.animationDelay = `${i * 160}ms`;

      kittyStage.appendChild(heart);
      heart.addEventListener('animationend', () => heart.remove());
    }
  }

  function triggerPetBounce() {
    catSprite.classList.remove('pet-click');
    // Force reflow so the animation can restart if clicked again quickly.
    void catSprite.offsetWidth;
    catSprite.classList.add('pet-click');
  }

  catWrap.addEventListener('click', () => {
    if (!pettingMode) return;
    triggerPetBounce();
    spawnHeartsFromCat();
  });

  petKittyBtn.addEventListener('click', () => {
    finishOverlay.hidden = true;
    pettingMode = true;
    kittyStage.classList.add('petting-mode');
  });

  strategiesBtn.addEventListener('click', () => {
    strategiesBtn.hidden = true;
    strategiesList.hidden = false;
    petKittyBtn.hidden = false;
    finishMessage.textContent = 'Strategies for Thinking Errors';
  });

  buildBubbles();
  updateCatSprite();
})();