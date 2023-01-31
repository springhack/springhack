/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2023-02-01 00:02:26
 *  Filename: admin/js/index.js
 *  Description: Created by SpringHack using vim automatically.
 */
// Inject github markdown css
CMS.registerPreviewStyle('/admin/css/markdown.css');

// Login button click
document.addEventListener('click', (ev) => {
  // Ignore other click events
  if (ev && ev.target && ev.target.className && ev.target.className.includes &&
      ev.target.className.includes('LoginButton')) {
    // Stop propagation right now
    ev.stopImmediatePropagation();
    const url = new URL(location.href);
    const redirectUri = `${url.origin}${url.pathname}`;
    const newUrl = new URL('https://github.com/login/oauth/authorize');
    newUrl.searchParams.set('scope', 'public_repo');
    newUrl.searchParams.set('redirect_uri', redirectUri);
    newUrl.searchParams.set('client_id', globalThis.oauthInfo.client_id);
    location.href = newUrl.toString();
  }
  // Oops...
  return;
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
