/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2022-09-28 15:26:24
 *  Filename: index.js
 *  Description: Created by SpringHack using vim automatically.
 */
// Inject github markdown css
CMS.registerPreviewStyle('/admin/markdown.css');

// Hook login phase
let loginButton = null;
let loginForm = null;
let changed = false;
let timer = null;
let frame = null;

// Login button click
document.addEventListener('click', (ev) => {
  // Ignore other click events
  if (ev && ev.target && ev.target.className && ev.target.className.includes &&
      ev.target.className.includes('LoginButton')) {
    // Stop propagation right now
    ev.stopImmediatePropagation();
    if (changed) {
      return;
    }
    // Open window for auth
    const frame = document.createElement('iframe');
    frame.src = './passport.html';
    frame.className = 'passport-frame';
    frame.referrerPolicy = 'no-referrer';
    document.body.appendChild(frame);
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'passport') {
        const {token} = event.data;
        const netlifyCmsUser = {token, backendName: 'github'};
        localStorage.setItem(
            'netlify-cms-user', JSON.stringify(netlifyCmsUser));
        location.reload();
      }
    });
  }
  // Oops...
  return;
}, true);

// Login button long press start
document.addEventListener('mousedown', (ev) => {
  if (ev && ev.target && ev.target.className && ev.target.className.includes &&
      ev.target.className.includes('LoginButton')) {
    timer = setTimeout(() => {
      changed = true;
      // Exchange UI
      loginButton = ev.target;
      loginButton.style.visibility = 'hidden';
      loginForm = document.createElement('form');
      loginButton.parentElement.insertBefore(loginForm, loginButton);
      // Token input element
      let input = document.createElement('input');
      input.autocomplete = 'current-password';
      input.placeholder = 'wtf does the fuck say';
      input.autofocus = true;
      input.type = 'password';
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          const token = input.value;
          const netlifyCmsUser = {token, backendName: 'github'};
          localStorage.setItem(
              'netlify-cms-user', JSON.stringify(netlifyCmsUser));
          location.reload();
        }
      });
      input.style.width = '300px';
      input.style.padding = '7px';
      input.style.fontSize = '15px';
      input.style.textAlign = 'center';
      input.style.borderRadius = '20px';
      loginForm.appendChild(input);
      input.focus();
      // Login form
      loginForm.style.top = '-38px';
      loginForm.style.height = '0px';
      loginForm.style.position = 'relative';
    }, 2000);
  }
}, true);

// Login button long press end
document.addEventListener('mouseup', (ev) => {
  clearTimeout(timer);
  // Ignore other click events
  if (changed && ev && ev.target && ev.target.className &&
      ev.target.className.includes &&
      ev.target.className.includes('LoginButton')) {
    // Stop propagation right now
    ev.stopImmediatePropagation();
  }
}, true);

// Custom widget for filename
const FilenameWidgetControl = createClass({
  getInitialState: function() {
    FilenameWidgetControl.updateFilename = (filename) =>
        this.props.onChange(filename);
    return {};
  },
  render: function() {
    return h('input', {
      type: 'text',
      disabled: true,
      id: this.props.forID,
      value: this.props.value || (new URL(location.href)).hash.split('/').pop(),
      className: this.props.classNameWrapper
    });
  }
});
FilenameWidgetControl.updateFilename = () => {};
CMS.registerWidget('filename', FilenameWidgetControl, null, {properties: {}});

// Monitor title field change, update to filename
document.addEventListener('input', (event) => {
  if (event.target instanceof HTMLInputElement &&
      event.target.id.startsWith('title-field-')) {
    FilenameWidgetControl.updateFilename(
        pinyinUtil.getPinyin(event.target.value, '-', false, false));
  }
});
