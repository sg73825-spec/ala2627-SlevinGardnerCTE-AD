const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const clock = document.querySelector('#clock');

themeToggle.addEventListener('click', () => {
  const isDay = root.dataset.theme === 'day';
  root.dataset.theme = isDay ? 'night' : 'day';
  themeToggle.setAttribute('aria-pressed', String(!isDay));
  themeToggle.setAttribute('aria-label', isDay ? 'Switch to daylight theme' : 'Switch to night theme');
  themeToggle.querySelector('.toggle-icon').textContent = isDay ? '\u2638' : '\u263e';
});

const updateClock = () => {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Phoenix', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date());
  clock.textContent = `${time} MST`;
};

updateClock();
window.setInterval(updateClock, 1000);
