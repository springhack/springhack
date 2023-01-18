---
layout: post
title: PICO-8 run in Electron
categories: code
description: Wasm run pico-8 in electron
keywords: pico-8, electron
---

### 简单来说，将官网扒下来的混淆后的 js 跑在 electron 里面


> PS: 用了 node-gamepad 模块，里面的键位设计是按照 Waveshare GameHat 的键位设计的

> 目标是树莓派能跑起来，目前这个能跑

 1. gamepad 的逻辑，检测 controller 并模拟 KeyboardEvent

```javascript
/*
        Author: SpringHack - springhack@live.cn
        Last modified: 2019-01-10 17:07:03
        Filename: lib/gamepad.js
        Description: Created by SpringHack using vim automatically.
 */
const nodeGamepad = require('gamepad');

// Gamepad initial
nodeGamepad.init();
setInterval(nodeGamepad.processEvents, 16);
setInterval(nodeGamepad.detectDevices, 500);


// Joystick area
/*
 * UP: axis = 1, value = -1
 * DOWN: axis = 1, value = 1
 * LEFT: axis = 0, value = -1
 * RIGHT: axis = 0, value = 1
 * */
const jsKeyMap = {
  '1' : {
    '-1': {
      code: 'ArrowUp',
      key: 'ArrowUp',
      keyCode: 38
    },
    '1': {
      code: 'ArrowDown',
      key: 'ArrowDown',
      keyCode: 40
    }
  },
  '0': {
    '-1': {
      code: 'ArrowLeft',
      key: 'ArrowLeft',
      keyCode: 37
    },
    '1': {
      code: 'ArrowRigth',
      key: 'ArrowRight',
      keyCode: 39
    }
  }
};
const axisState = [ 0, 0 ];
nodeGamepad.on('move', function (id, axis, _value) {
  // Get last state of this axis
  const last = axisState[axis]; 
  axisState[axis] = _value;
  // Set value
  let value = _value;
  // If axis reset to 0, we set value's number to make info right
  if (!value) {
    value = last;
  }
  // Event info
  let event = jsKeyMap[axis][value];
  // Dispatch key down or up event
  document.dispatchEvent(new KeyboardEvent(_value ? 'keydown' : 'keyup', event));
});


// Normal button area
/*
 * A: 0
 * B: 1
 * X: 3
 * Y: 4
 * Start: 10
 * Select: 11
 * Left Trigger: 7
 * Right Trigger: 6
 * */
const keyMap = {
  '0': 'z',
  '1': 'x',
  '3': 'c',
  '4': 'v',
  '7': 'n',
  '6': 'm',
  '10': 'Enter',
  '11': 'Escape'
};
const getKeyEvent = (char) => {
  if (char.startsWith('E')) {
    return {
      key: char,
      code: char,
      keyCode: (char === 'Enter') ? 13 : 27
    }
  }
  return {
    key: char,
    code: `Key${char.toLocaleUpperCase()}`,
    keyCode: char.toLocaleUpperCase().charCodeAt(0)
  };
};
const exitJudge = (inc, num) => {
  exitJudge.sum = inc ? (exitJudge.sum + num) : (exitJudge.sum - num);
  console.log(exitJudge.sum);
  if (exitJudge.sum === 21) require('electron').remote.app.quit();
}
exitJudge.sum = 0;
nodeGamepad.on('down', function (id, num) {
  exitJudge(1, num);
  document.dispatchEvent(new KeyboardEvent('keydown', getKeyEvent(keyMap[num])));
});

nodeGamepad.on('up', function (id, num) {
  exitJudge(0, num);
  document.dispatchEvent(new KeyboardEvent('keyup', getKeyEvent(keyMap[num])));
});
```

 2. 拦截网络请求

> 这部分是 pico-8 使用 wasm 调用的接口，我们这里提前给设置好，那么 wasm 初始化就不会覆盖这个方法
> 我们区分下，请求 carts 的我们调用 fs 读取本地文件，这样可以做到运行本地卡带

```javascript
/*
        Author: SpringHack - springhack@live.cn
        Last modified: 2019-01-10 14:45:24
        Filename: lib/renderer.js
        Description: Created by SpringHack using vim automatically.
 */
const node_fs = require('fs');
const node_path = require('path');

const HACK_PREFIX = '/hack/carts/';

const canvas = document.getElementById('canvas');
canvas.widthNative = 128;
canvas.heightNative = 128;

Module = {
  canvas,
  arguments: [`${HACK_PREFIX}${decodeURI(location.search.replace('?file=', ''))}`],
  readAsync(url, onload, onerror) {
    if (url.startsWith(HACK_PREFIX)) {
      const file = url.replace(HACK_PREFIX, '');
      node_fs.readFile(node_path.resolve(__dirname, '..', 'carts', file), (err, buffer) => {
        if (err) return onerror(err);
        onload(buffer);
      });
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', `https://www.lexaloffle.com/${url}`, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      var data = tryParseAsDataURI(url);
      if (data) {
        onload(data.buffer);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  }
};
```

