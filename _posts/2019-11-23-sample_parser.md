---
layout: post
categories:
  - code
published: true
description: 一种调试 macOS 客户端的思路
keywords: 'macOS, sample, atos'
title: macOS 现场调试的一种 sample 解决思路
---
### 背景

1. macOS 上客户端程序可能存在异常(高 CPU，高内存，死循环)
2. 能够接触到现场，但是不能长时间占用(客户的电脑)
3. 客户电脑没有任何开发工具

### 解决方案

1. 抓 sample 并保存到文件
 - 使用 Activity Monitor，双击进程，取样，存储
 - `sample` 命令
2. 配合符号，分析 sample 文件，还原当时的调用栈
 - `atos` 命令解析对应地址在符号文件(dSYM)的函数名
 - `dwarfdump` 命令分析符号的 uuid 并匹配 sample 文件
3. 调查代码，还原问题

### 简化方案

 - 我写了一个 `sample_parser` 用来简化这个操作
 - 简单的 `sample_parser [dSYM] [Sample.log]` 调用，输出函数栈
 - 使用强大的 `bash shell` 编写(小工具编写使用 `shell` 情有独钟)
 
### `sample_parser` 源码

> 这里我就直接贴源码了，使用前提是确保安装了 `Xcode` 以及其 `CLI` 工具集

```shell
#!/bin/bash

WORK_DIR="$(mktemp)_dir"
WORK_LIST="${WORK_DIR}/list"
WORK_ADDR="${WORK_DIR}/addr"

function log_info {
  NOW=`date`
  echo -e "\033[42;37m [${NOW}] [LOG]  ${*} \033[0m" > /dev/stderr
}

function log_warning {
  NOW=`date`
  echo -e "\033[43;37m [${NOW}] [LOG]  ${*} \033[0m" > /dev/stderr
}

function log_error {
  NOW=`date`
  echo -e "\033[41;37m [${NOW}] [ERR]  ${*} \033[0m" > /dev/stderr
}

function sample_help {
  cat << EOF
Usage: ${0} {dsym_file_path} {sample_log_path}
  dsym_file_path: dSYM symbol file path
  sample_log_path: sample.log file path
EOF
}

function get_address_list {
  local IFS=$'\n'
  local base_addr="${1}"
  local dsym="${2}"
  local sample="${3}"
  log_info 'Generating ...'
  for line in $(cat "${sample}");
  do
    if [ "$(echo $line | grep "${base_addr}" | xargs)" != "" ];
    then
      addr=$(echo "$line" | egrep -E "\[(\w*)\]" -o | sed 's/^\[\(.*\)\]$/\1/')
      echo ${addr} >> ${WORK_LIST}
    fi
  done
}

function run_atos {
  local base_addr="${1}"
  local dsym="${2}"
  log_info 'Parseing ...'
  atos -o "${dsym}" -arch x86_64 -l "${base_addr}" < ${WORK_LIST} > ${WORK_ADDR}
}

function parse_address {
  local IFS=$'\n'
  local base_addr="${1}"
  local dsym="${2}"
  local sample="${3}"
  local number=1
  log_info 'Formatting ...'
  for line in $(cat "${sample}");
  do
    if [ "$(echo $line | grep "${base_addr}" | xargs)" != "" ];
    then
      local addr=$(echo "$line" | egrep -E "\[(\w*)\]" -o | sed 's/^\[\(.*\)\]$/\1/')
      echo -n "Parse addr(${addr}): "
      sed -n "${number}p" ${WORK_ADDR}
      number=$((number + 1))
    else
      echo "$line" | xargs
    fi
  done
}

function get_dsym_uuid {
  dsym="$1"
  xcrun dwarfdump --uuid "${dsym}" |  awk '{print $2}'
}

function get_base_addr_by_uuid {
  uuid="$1"
  sample="$2"
  cat "${sample}" | grep "${uuid}" | awk '{print $1}'
}

function main {
  local dsym="$1"
  local sample="$2"
  if [ "$dsym" == "" ] || [ "$sample" == "" ];
  then
    log_error "Need params !"
    sample_help
    return
  fi
  local uuid="$(get_dsym_uuid "${dsym}")"
  if [ "${uuid}" == "" ];
  then
    log_error "Error get uuid !"
    return
  fi
  local base_addr="$(get_base_addr_by_uuid "${uuid}" "${sample}")"
  if [ "${base_addr}" == "" ];
  then
    log_error "Error get base addr !"
    return
  fi
  log_info "Base address is ${base_addr} ..."
  mkdir -p ${WORK_DIR}
  get_address_list "${base_addr}" "${dsym}" "${sample}"
  run_atos "${base_addr}" "${dsym}"
  parse_address "${base_addr}" "${dsym}" "${sample}"
}

main "$@"
```