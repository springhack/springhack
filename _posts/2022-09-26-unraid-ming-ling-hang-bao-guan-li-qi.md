---
layout: post
filename: unraid-ming-ling-hang-bao-guan-li-qi
title: unraid 命令行包管理器
categories:
  - code
description: 因为每次升级完新版本都要等 nerdtool 升级太痛苦了...
keywords: unraid, package manager, spkg, nerdtool
---
### Usage

> 更新：新增了在线下载地址，可以从这里获取最新版 `https://dosk.host/repo/shell/spkg`，并且增加了 `self-upgrade` 命令更新自己

> 就一个命令 `spkg`，非常简单

```bash
spkg search vim
spkg install vim
spkg remove vim
spkg list vim
spkg help
```

### Code

> 代码随手贴一下，因为就临时手撕的所以很多逻辑违反人性，比如一次只能安装一个包(如果多个 `match` 就是靠前的包)，不能自行装依赖等

```bash
#!/bin/bash

REPO_VERS="slackware64"
REPO_NAME=(
  "slackware"
  "conraid"
)
declare -A REPO_URLS=(
  ["slackware"]="https://mirrors.slackware.com/slackware/slackware64-current"
  ["conraid"]="https://slack.conraid.net/repository/slackware64-current"
)

opt="$1"
shift
pkgs_list="$@"
mkdir -p /boot/extra

log() {
  eol=${4:-"\n"}
  echo -n -e "$1\033[0;35m[$2]\033[0m $3$eol" 1>&2
}

usage() {
  cat << EOF
Usage:
  spkg [OPERATION] [PACKAGE_NAME...]
    OPERATION: update/upgrade/search/install/remove/list/help
EOF
}

remove_last_column() {
  awk -F- 'OFS="-"{$NF="";print}' | sed 's/-$//g' | xargs
}

get_pkg_name() {
  remove_last_column | remove_last_column | remove_last_column
}

get_pkg_vers() {
  remove_last_column | remove_last_column | awk -F- '{print $NF}'
}

get_pkg_arch() {
  remove_last_column | awk -F- '{print $NF}'
}

ensure_update() {
  cached="yes"
  for repo in "${REPO_NAME[@]}";
  do
    if ! [ -f /tmp/spkg.d/${repo}.list ];
    then
      cached="no"
    fi
  done
  if [ "$cached" != "yes" ];
  then
    log '' '*' 'No repo cache in local, need run update first !'
    exit -2
  fi
}

case $opt in
  update)
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "Update repo ..."
    rm -rvf /tmp/spkg.d >/dev/null 2>&1
    mkdir -p /tmp/spkg.d
    for repo in "${REPO_NAME[@]}";
    do
      repo_pkgs_url="${REPO_URLS[$repo]}/PACKAGES.TXT"
      log '' '<=>' "Update repo($repo) url($repo_pkgs_url) ..."
      curl -fSL --progress-bar "$repo_pkgs_url" -o /tmp/spkg.d/$repo.list
    done
    log '' '***' 'Done !'
    ;;
  search)
    ensure_update
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "Search repo for: $pkgs_list ..."
    printf "%-32s %-20s %-20s\n" "PACKAGE" "VERSION" "ARCHITECTURE"
    for pkg in $pkgs_list;
    do
      files="$(cat /tmp/spkg.d/*.list | grep -ni "PACKAGE NAME:  *${pkg}*" | awk '{print $3}')"
      if [ "$files" != "" ];
      then
        for file in $files;
        do
          name="$(get_pkg_name <<< "${file}")"
          vers="$(get_pkg_vers <<< "${file}")"
          arch="$(get_pkg_arch <<< "${file}")"
          if [ "$name" != "" ];
          then
            printf "%-32s %-20s %-20s\n" "$name" "$vers" "$arch"
          fi
        done
      fi
    done
    ;;
  install|upgrade)
    ensure_update
    opt_txt="$(tr 'a-z' 'A-Z' <<< ${opt:0:1})${opt:1}"
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "${opt_txt} packages: ${pkgs_list} ..."
    for pkg in $pkgs_list;
    do
      grep_command="grep -niH 'PACKAGE NAME:  ${pkg}'"
      for repo in "${REPO_NAME[@]}";
      do
        grep_command="$grep_command /tmp/spkg.d/${repo}.list"
      done
      info=""
      lines="$(eval "$grep_command" | sed 's/PACKAGE NAME:  //g')"
      for line in $lines;
      do
        maybe_file="$(awk -F: '{print $3}' <<< "${line}")"
        maybe_name="$(get_pkg_name <<< $maybe_file)"
        if [ "$maybe_name" = "$pkg" ];
        then
          info="$line"
        fi
      done
      if [ "$info" = "" ];
      then
        log '' '***' "Package not found: $pkg ..."
        continue
      fi
      repo=$(basename $(awk -F: '{print $1}' <<< "$info") .list)
      line="$(awk -F: '{print $2}' <<< "${info}")"
      file="$(awk -F: '{print $3}' <<< "${info}")"
      location_all="$(tail +${line} /tmp/spkg.d/${repo}.list | grep "PACKAGE LOCATION")"
      location="$(head -n1 <<< "${location_all}" | awk '{print $3}')"
      file_url="${REPO_URLS[$repo]}/$location/$file"
      file_url="${file_url/\.\//}"
      log '' '<=>' "Download pkg($file) in repo($repo) with url($file_url) ..."
      curl -fSL --progress-bar "$file_url" -o /boot/extra/${file}
      log '' '<=>' "${opt_txt} pkg($file) in repo($repo) with url($file_url) ..."
      eval "${opt}pkg /boot/extra/${file}"
      log '' '***' "Package $file installed !"
    done
    ;;
  remove)
    ensure_update
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "Remove packages: ${pkgs_list} ..."
    for pkg in $pkgs_list;
    do
      file=""
      files="$(ls /var/log/packages/${pkg}* 2>/dev/null | xargs basename 2>/dev/null)"
      for maybe_file in $files;
      do
        maybe_name="$(get_pkg_name <<< $maybe_file)"
        if [ "$maybe_name" = "$pkg" ];
        then
          file="$maybe_file"
        fi
      done
      if [ "$file" = "" ];
      then
        log '' '***' "Package not install: $pkg ..."
        continue
      fi
      removepkg $file
      for file in $(find /boot/extra -type f -name "$file*");
      do
        rm $file
      done
    done
    ;;
  list)
    ensure_update
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "List packages: ${pkgs_list} ..."
    printf "%-32s %-20s %-20s\n" "PACKAGE" "VERSION" "ARCHITECTURE"
    pkgs="$(sed 's/ /\\|/g' <<< "${pkgs_list}")"
    files="$(ls /var/log/packages/ | grep "$pkgs")"
    if [ "$files" != "" ];
    then
      for file in $files;
      do
        name="$(get_pkg_name <<< "${file}")"
        vers="$(get_pkg_vers <<< "${file}")"
        arch="$(get_pkg_arch <<< "${file}")"
        if [ "$name" != "" ];
        then
          printf "%-32s %-20s %-20s\n" "$name" "$vers" "$arch"
        fi
      done
    fi
    ;;
  *)
    log '' '*' 'No such operation !'
    usage
    exit -1
    ;;
esac

exit 0

```
