const hand = document.getElementById('wave');
const emojis = ['👋', '👍', '🤙', '👊', '🤘', '👏', '✌️', '💪', '🎉', '🥳', '🚴‍♂️', '🌴', '🏖', '👀']

function randomNoRepeats(array) {
  let copy = array.slice(0);
  return function () {
    if (copy.length < 1) { copy = array.slice(0); }
    let index = Math.floor(Math.random() * copy.length);
    let item = copy[index];
    copy.splice(index, 1);
    return item;
  };
}

hand.onclick = function (e) {
  let pickEmoji = randomNoRepeats(emojis);
  let favicon = document.querySelector("link[rel~='icon']");
  let emoji = pickEmoji();
  this.innerText = emoji;
  favicon.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`;
  e.preventDefault();
}

let timer;
const code = document.getElementById('code')
function toggleCode() { document.querySelector('body').classList.toggle('code') }
code.addEventListener('mouseover', e => {
  setTimeout(() => {
    toggleCode()
  }, 100);
});
code.addEventListener('mouseleave', e => {
  setTimeout(() => {
    toggleCode()
  }, 100);
});