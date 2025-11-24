---
layout: post
filename: rpi3b+-pao-pi-kvm-xiang-mu-ji-lu
title: rpi3b+ 跑 pi-kvm 项目记录
categories:
  - code
description: 一些魔改
keywords: rpi3b+, kvm, pi-kvm, arduino
---
### 惯例先放两张成品图，没有 `ATX` 部分

![](/uploads/pi-kvm-a.png)

![](/uploads/pi-kvm-b.png)

### 就直接说魔改部分吧，`os` 按照官网 `build` 步骤来走

1. `de3.` 逻辑跑不通，直接干掉
2. 拉一些资源拉不到，直接加 `ALL_PROXY=socks5://x.x.x.x:xxx` 代理过去
3. `tesseract` 包依赖的测试数据 `tessdata` 拉不到，经查这是为了 `ocr` 功能，对我没用，删掉相关两个依赖
4. `make install` 不成功，可能是读卡器或者卡的问题，魔改让他不走 `xz` 然后 `make image` 出来镜像，烧录，另外我发现镜像里 `config.txt` 和 `cmdline.txt` 都没有，过程中也报了 `mv` 失败，但是能启动，就没管他
5. 最坑的部分，`sparkfun pro micro` 一开始用 `arduino ide` 测试的时候，很容易就刷错了，然后串口就出不来了，我一度认为可能需要重新买一个了，结果搜索到短接两次 `RST` 和 `GND` 有 `8` 秒的 `bootloader` 时间，因此修好了
6. 手头有电阻，没三极管，`reset hid` 功能不好使，本来半夜了就没多想，第二天上班的时候想了想：`rpi3b+` 把针脚设置为 `IN` 并关闭掉内置上下拉电阻就可以模拟高阻抗也就是悬空态；因为共地所以可以近似认为低电平达到 `GND` 效果；两个状态刚好是 `RST` 所需状态，所以修改代码顺利跑通，附代码

> 我只是注释掉原来的部分，并没有删除，改用 `RPi.GPIO` 是因为用的比较熟悉
>
> 文件：`/usr/lib/python3.10/site-packages/kvmd/plugins/hid/_mcu/gpio.py`

```python
# ========================================================================== #
#                                                                            #
#    KVMD - The main PiKVM daemon.                                           #
#                                                                            #
#    Copyright (C) 2018-2022  Maxim Devaev <mdevaev@gmail.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
# ========================================================================== #


import types
import time

from typing import Type
from typing import Optional

import gpiod

from ....logging import get_logger

import RPi.GPIO as GPIO


# =====
class Gpio:
    def __init__(
        self,
        device_path: str,
        reset_pin: int,
        reset_inverted: bool,
        reset_delay: float,
    ) -> None:
        GPIO.setmode(GPIO.BOARD)
        # self.__device_path = device_path
        self.__reset_pin = reset_pin
        # self.__reset_inverted = reset_inverted
        self.__reset_delay = reset_delay
        # self.__chip: Optional[gpiod.Chip] = None
        # self.__reset_line: Optional[gpiod.Line] = None

    def __enter__(self) -> None:
        GPIO.setup(self.__reset_pin, GPIO.IN, pull_up_down=GPIO.PUD_OFF)
        # if self.__reset_pin >= 0:
        #     assert self.__chip is None
        #     assert self.__reset_line is None
        #     self.__chip = gpiod.Chip(self.__device_path)
        #     self.__reset_line = self.__chip.get_line(self.__reset_pin)
        #     self.__reset_line.request("kvmd::hid::reset", gpiod.LINE_REQ_DIR_OUT, default_vals=[int(self.__reset_inverted)])

    def __exit__(
        self,
        _exc_type: Type[BaseException],
        _exc: BaseException,
        _tb: types.TracebackType,
    ) -> None:
        GPIO.cleanup()
        # if self.__chip:
        #     try:
        #         self.__chip.close()
        #     except Exception:
        #         pass
        #     self.__reset_line = None
        #     self.__chip = None

    def reset(self) -> None:
        GPIO.setup(self.__reset_pin, GPIO.OUT)
        GPIO.output(self.__reset_pin, GPIO.LOW)
        time.sleep(self.__reset_delay)
        GPIO.setup(self.__reset_pin, GPIO.IN, pull_up_down=GPIO.PUD_OFF)
        time.sleep(1)
        get_logger(0).info("Reset HID performed")
        # if self.__reset_pin >= 0:
        #     assert self.__reset_line
        #     try:
        #         self.__reset_line.set_value(int(not self.__reset_inverted))
        #         time.sleep(self.__reset_delay)
        #     finally:
        #         self.__reset_line.set_value(int(self.__reset_inverted))
        #         time.sleep(1)
        #     get_logger(0).info("Reset HID performed")
```