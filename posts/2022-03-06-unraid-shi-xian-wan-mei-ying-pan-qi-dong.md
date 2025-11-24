---
layout: post
filename: unraid-shi-xian-wan-mei-ying-pan-qi-dong
title: unraid 实现完美硬盘启动
categories:
  - code
description: 主要的步骤是编译内核
keywords: unraid, usb, vmware
---
### 大体思路

1. 在 `vmware` 里测试的，硬盘选择为 `sata` 所以下文所有情况基于 `sata`，其他情况请酌情更改

2. 硬盘启动无非就做到两件事：开机时识别硬盘(`sata`)；有一个优盘(假的，不需要真的插，不然就没意义了)

### 具体步骤

1. 编译内核，把 `sata` 的驱动从 `m` 改成 `*` 也就是内置而不是单独的文件

2. 还是编译内核，把 `dummy_hcd` 和 `g_mass_storage` 编译成模块(为了做 `mock` 优盘这件事)

3. 文件替换，`/bzimage` 和 `/bzmodules`，并在 `/config/go` 里面加两句代码

4. 文件创建，一个假的 `usb mass storage drive` 文件，我放在 `/config/usb` 了

### 相关连接

[Emulating usb device with a file](https://unix.stackexchange.com/questions/373569/emulating-usb-device-with-a-file-using-g-mass-storage-udc-core-couldnt-find)

[rtl8125-driver-for-unraid-6.8.2
](https://github.com/fanhuanji/rtl8125-driver-for-unraid-6.8.2/blob/main/compile_drivers.md)

### 注意事项

1. 如果是生成 `vmware` 的 `vmdk` 引导，请注意尽量 `efi` 模式，也就是直接解压原版文件后把 `EFI-` 目录更名为 `EFI` 即可，无需 `make_bootable`，因为实测会有概率将 `sata` 硬盘识别为 `usb` 导致启动后乱套

2. `/config/usb` 文件不能太小，我用了一兆，且需要包含一个 `fat` 分区 `label=UNRAID`，直接 `fdisk` 搞一下再 `losetup + mkfs.vfat` 即可

### 相关代码

> 这个是 `config/usb` 里增加的代码

```bash
# Fake usb flash drive
modprobe dummy_hcd
modprobe g_mass_storage file=/boot/config/usb idVendor=0x1d6b idProduct=0x0104 iManufacturer=Myself iProduct=VirtualBlockDevice iSerialNumber=A11FAF09DD45C4A8
```

> 这个是内核编译的配置文件 `diff`，我基于的是 `6.9.2` 版本

```diff
5c5
< CONFIG_CC_VERSION_TEXT="gcc (GCC) 9.3.0"
---
> CONFIG_CC_VERSION_TEXT="gcc (Debian 10.2.1-6) 10.2.1 20210110"
7,8c7,8
< CONFIG_GCC_VERSION=90300
< CONFIG_LD_VERSION=233010000
---
> CONFIG_GCC_VERSION=100201
> CONFIG_LD_VERSION=235020000
776d775
< # CONFIG_GCC_PLUGINS is not set
1961c1960
< CONFIG_SATA_AHCI=m
---
> CONFIG_SATA_AHCI=y
1964c1963
< CONFIG_SATA_INIC162X=m
---
> CONFIG_SATA_INIC162X=y
1966c1965
< CONFIG_SATA_SIL24=m
---
> CONFIG_SATA_SIL24=y
1980c1979
< CONFIG_ATA_PIIX=m
---
> CONFIG_ATA_PIIX=y
1982,1989c1981,1988
< CONFIG_SATA_MV=m
< CONFIG_SATA_NV=m
< CONFIG_SATA_PROMISE=m
< CONFIG_SATA_SIL=m
< CONFIG_SATA_SIS=m
< CONFIG_SATA_SVW=m
< CONFIG_SATA_ULI=m
< CONFIG_SATA_VIA=m
---
> CONFIG_SATA_MV=y
> CONFIG_SATA_NV=y
> CONFIG_SATA_PROMISE=y
> CONFIG_SATA_SIL=y
> CONFIG_SATA_SIS=y
> CONFIG_SATA_SVW=y
> CONFIG_SATA_ULI=y
> CONFIG_SATA_VIA=y
1996c1995
< CONFIG_PATA_AMD=m
---
> CONFIG_PATA_AMD=y
1998c1997
< CONFIG_PATA_ATIIXP=m
---
> CONFIG_PATA_ATIIXP=y
2009,2010c2008,2009
< CONFIG_PATA_JMICRON=m
< CONFIG_PATA_MARVELL=m
---
> CONFIG_PATA_JMICRON=y
> CONFIG_PATA_MARVELL=y
2014c2013
< CONFIG_PATA_OLDPIIX=m
---
> CONFIG_PATA_OLDPIIX=y
2016,2017c2015,2016
< CONFIG_PATA_PDC2027X=m
< CONFIG_PATA_PDC_OLD=m
---
> CONFIG_PATA_PDC2027X=y
> CONFIG_PATA_PDC_OLD=y
2022,2023c2021,2022
< CONFIG_PATA_SIL680=m
< CONFIG_PATA_SIS=m
---
> CONFIG_PATA_SIL680=y
> CONFIG_PATA_SIS=y
2026c2025
< CONFIG_PATA_VIA=m
---
> CONFIG_PATA_VIA=y
3858a3858
> # CONFIG_USBIP_VUDC is not set
3962,3963c3962,4029
< # CONFIG_USB_GADGET is not set
< # CONFIG_TYPEC is not set
---
> CONFIG_USB_GADGET=y
> # CONFIG_USB_GADGET_DEBUG_FILES is not set
> # CONFIG_USB_GADGET_DEBUG_FS is not set
> CONFIG_USB_GADGET_VBUS_DRAW=2
> CONFIG_USB_GADGET_STORAGE_NUM_BUFFERS=2
> 
> #
> # USB Peripheral Controller
> #
> # CONFIG_USB_FOTG210_UDC is not set
> # CONFIG_USB_GR_UDC is not set
> # CONFIG_USB_R8A66597 is not set
> # CONFIG_USB_PXA27X is not set
> CONFIG_USB_MV_UDC=m
> # CONFIG_USB_MV_U3D is not set
> # CONFIG_USB_M66592 is not set
> # CONFIG_USB_BDC_UDC is not set
> # CONFIG_USB_AMD5536UDC is not set
> # CONFIG_USB_NET2272 is not set
> CONFIG_USB_NET2280=m
> # CONFIG_USB_GOKU is not set
> # CONFIG_USB_EG20T is not set
> CONFIG_USB_DUMMY_HCD=m
> # end of USB Peripheral Controller
> 
> CONFIG_USB_LIBCOMPOSITE=m
> CONFIG_USB_F_MASS_STORAGE=m
> # CONFIG_USB_CONFIGFS is not set
> 
> #
> # USB Gadget precomposed configurations
> #
> # CONFIG_USB_ZERO is not set
> # CONFIG_USB_ETH is not set
> # CONFIG_USB_G_NCM is not set
> CONFIG_USB_GADGETFS=m
> # CONFIG_USB_FUNCTIONFS is not set
> CONFIG_USB_MASS_STORAGE=m
> # CONFIG_USB_GADGET_TARGET is not set
> # CONFIG_USB_G_SERIAL is not set
> # CONFIG_USB_G_PRINTER is not set
> # CONFIG_USB_CDC_COMPOSITE is not set
> # CONFIG_USB_G_ACM_MS is not set
> # CONFIG_USB_G_MULTI is not set
> # CONFIG_USB_G_HID is not set
> # CONFIG_USB_G_DBGP is not set
> # CONFIG_USB_G_WEBCAM is not set
> CONFIG_USB_RAW_GADGET=m
> # end of USB Gadget precomposed configurations
> 
> CONFIG_TYPEC=m
> # CONFIG_TYPEC_TCPM is not set
> # CONFIG_TYPEC_UCSI is not set
> # CONFIG_TYPEC_TPS6598X is not set
> # CONFIG_TYPEC_STUSB160X is not set
> 
> #
> # USB Type-C Multiplexer/DeMultiplexer Switch support
> #
> # CONFIG_TYPEC_MUX_PI3USB30532 is not set
> # end of USB Type-C Multiplexer/DeMultiplexer Switch support
> 
> #
> # USB Type-C Alternate Mode drivers
> #
> # CONFIG_TYPEC_DP_ALTMODE is not set
> # end of USB Type-C Alternate Mode drivers
> 

```
