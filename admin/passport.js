/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2022-09-28 15:27:00
 *  Filename: passport.js
 *  Description: Created by SpringHack using vim automatically.
 */
const user = document.getElementById('user');
const pass = document.getElementById('pass');
const login = document.getElementById('login');
const loading = document.getElementById('loading');

const doLoading = (show) => {
  loading.style.display = show ? 'block' : 'none';
};

login.addEventListener('click', async () => {
  doLoading(true);
  const form = new FormData();
  form.set('email', user.value);
  form.set('token', pass.value);
  let token = null;
  try {
    token = await fetch('https://win.dosk.win/', {method: 'POST', body: form})
                .then(res => res.text());
  } catch (err) {
    alert(`Login failed: ${err.message}`);
    doLoading(false);
    return;
  }
  window.parent.postMessage({type: 'passport', token}, '*');
  doLoading(false);
});
