/* ===== Breathing Basket Catch — game logic =====
   Drop your own PNGs into games/images/ named:
     basket.png, apple.png, banana.png, grape.png, sparkle.png
   If a PNG isn't found yet, a friendly emoji fallback is shown instead,
   so the game works right away and upgrades automatically once you add art.
*/

(() => {
  const stage = document.getElementById('game-stage');
  const basketEl = document.getElementById('basket');
  const fruitCountEl = document.getElementById('fruit-count');
  const sparkleCountEl = document.getElementById('sparkle-count');

  const relaxOverlay = document.getElementById('relax-overlay');
  const relaxTitleEl = document.getElementById('relax-title');
  const relaxTextEl = document.getElementById('relax-text');
  const relaxDoneBtn = document.getElementById('relax-done-btn');

  const BASKET_WIDTH = 90;
  const ITEM_WIDTH = 50;
  const SPAWN_INTERVAL_MS = 1100;
  const SPARKLE_CHANCE = 0.1;

  const FRUIT_TYPES = ['apple', 'banana', 'grape'];

  const playBtn = document.getElementById('play-btn');
  const startOverlay = document.getElementById('start-overlay');

  // Short, original calm-down scripts. One is picked at random each time
  // a sparkle is caught. Feel free to edit the wording to match your voice.
  const RELAX_EXERCISES = [
    {
      title: 'Belly Breathing',
      text: "Let's take a breather. Breathe in slowly through your nose for 4 counts... hold it gently for 4... and breathe out through your mouth for 4. Do that two or three more times.",
    },
    {
    title: 'Growing Calm',
    text: "Imagine you are planting a tiny seed in your Mind Garden. Breathe in slowly as the seed begins to grow, hold for a moment as it reaches toward the sunlight, and breathe out as it blooms. Take a few slow breaths and let yourself feel grounded.",
    },
    {
    title: 'Watering Your Garden',
    text: "Think of your mind as a garden that needs care. With every slow breath in, imagine watering your plants with kindness. With every breath out, let go of worries.",
    },
    {
      title: 'A Peaceful Garden',
      text: "Imagine yourself sitting in a quiet garden. Look around at the flowers, trees, and plants growing around you. Notice the colours, the gentle breeze, and the sounds of nature. Take a few slow breaths and imagine your garden becoming a little more peaceful with each breath.",
    },
    {
      title: 'Growing Calm',
      text: "Just like plants need care, your body needs moments to rest. Gently relax your shoulders like a flower opening in the sunlight. Let your hands loosen like leaves floating softly in the breeze. Notice the calm growing inside you as you release any tension.",
    },
  ];

  let gameStarted = false;

  let basketX = 0;

  let fruitCount = 0;
  let sparkleCount = 0;
  let isPaused = false;
  let spawnTimer = null;
  let fallingItems = []; // { el, x, y, speed, type }


  function setBasketX(x) {
    const stageWidth = stage.clientWidth;
    basketX = Math.max(0, Math.min(x, stageWidth - BASKET_WIDTH));
    basketEl.style.left = basketX + 'px';
  }

  function initBasket() {
    setBasketX(stage.clientWidth / 2 - BASKET_WIDTH / 2);
  }

  function handlePointerMove(clientX) {
    const rect = stage.getBoundingClientRect();
    setBasketX(clientX - rect.left - BASKET_WIDTH / 2);
  }

  stage.addEventListener('mousemove', (e) => {
  if (!isPaused && gameStarted) {
    handlePointerMove(e.clientX);
  }
  });

  stage.addEventListener('touchmove', (e) => {
    if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
    e.preventDefault();
  }, { passive: false });


  function spawnItem() {
    if (isPaused) return;

    const stageWidth = stage.clientWidth;
    const isSparkle = Math.random() < SPARKLE_CHANCE;
    const type = isSparkle
      ? 'sparkle'
      : FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];

    const el = document.createElement('div');
    el.className = 'falling-item falling-item--' + type;

    const img = document.createElement('img');
    img.src = 'images/' + type + '.png';
    img.alt = type;
    el.appendChild(img);

    const x = Math.random() * Math.max(0, stageWidth - ITEM_WIDTH);
    el.style.left = x + 'px';
    el.style.top = '-60px';
    stage.appendChild(el);

    fallingItems.push({
      el,
      x,
      y: -60,
      speed: 2.2 + Math.random() * 1.3,
      type,
    });
  }

  function startSpawning() {
    if (spawnTimer) clearInterval(spawnTimer);
    spawnTimer = setInterval(spawnItem, SPAWN_INTERVAL_MS);
  }

  function stopSpawning() {
    clearInterval(spawnTimer);
    spawnTimer = null;
  }

  function clearFallingItems() {
    fallingItems.forEach((item) => item.el.remove());
    fallingItems = [];
  }
  function triggerRelaxation() {
    isPaused = true;
    stopSpawning();
    clearFallingItems();

    const exercise = RELAX_EXERCISES[Math.floor(Math.random() * RELAX_EXERCISES.length)];
    relaxTitleEl.textContent = exercise.title;
    relaxTextEl.textContent = exercise.text;

    // hide button first
    relaxDoneBtn.hidden = true;

    // show overlay
    relaxOverlay.hidden = false;

    // show button after 10 seconds
    setTimeout(() => {
      relaxDoneBtn.hidden = false;
    }, 7500);
  }

  relaxDoneBtn.addEventListener('click', () => {
    relaxOverlay.hidden = true;
    isPaused = false;
    startSpawning();
  });

  function gameLoop() {
    if (!isPaused) {
      const stageHeight = stage.clientHeight;
      const basketRect = {
        left: basketX,
        right: basketX + BASKET_WIDTH,
        top: stageHeight - 65,
      };

      for (let i = fallingItems.length - 1; i >= 0; i--) {
        const item = fallingItems[i];
        item.y += item.speed;
        item.el.style.top = item.y + 'px';

        const itemRect = {
          left: item.x,
          right: item.x + ITEM_WIDTH,
          bottom: item.y + ITEM_WIDTH,
        };

        const overlapsX = itemRect.right > basketRect.left && itemRect.left < basketRect.right;
        const reachedBasket = itemRect.bottom > basketRect.top;

        if (overlapsX && reachedBasket && item.y < stageHeight) {
          item.el.remove();
          fallingItems.splice(i, 1);

          if (item.type === 'sparkle') {
            sparkleCount++;
            sparkleCountEl.textContent = sparkleCount;
            triggerRelaxation();
          } else {
            fruitCount++;
            fruitCountEl.textContent = fruitCount;
          }
          continue;
        }

        if (item.y > stageHeight) {
          item.el.remove();
          fallingItems.splice(i, 1);
        }
      }
    }

    requestAnimationFrame(gameLoop);
  }

window.addEventListener('load', () => {
  initBasket();
  requestAnimationFrame(gameLoop);
});

playBtn.addEventListener('click', () => {
  gameStarted = true;
  startOverlay.style.display = 'none';
  startSpawning();
});

  window.addEventListener('resize', () => {
    setBasketX(basketX);
  });
})();