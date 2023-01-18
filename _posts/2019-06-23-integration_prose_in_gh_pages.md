---
layout: post
categories:
  - code
published: true
keywords: 'github, pages, '
title: 集成 Prose 到 Github Pages
description: 如何集成 Prose 到 Github Pages
---
### 为啥用 Prose

因为想要搞一个简单的后台管理

### 步骤

其实很简单

1. 建立 admin/index.html，方便跳转，内容如下

> 记得项目地址路径换成自己的

```html
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
    <meta http-equiv='refresh' content='0;https://prose.io/#springhack/springhack.github.io/tree/master/_posts'>
    <title>Loading...</title>
  </head>
  <body>
  </body>
</html>
```

2. `_config.yml` 增加如下内容，这里我只是增加了 `media` 路径与 `metadata` 的部分我感兴趣的东西

```yaml
prose:
  media: "assets/upload"
  metadata:
    _posts:
      - name: "categories"
        field:
          element: "multiselect"
          label: "Blog categories"
          value: "code"
          options:
            - name: "Code"
              value: "code"
            - name: "Game"
              value: "game"
            - name: "Life"
              value: "life"
      - name: "description"
        field:
          element: "text"
          label: "Blog description"
          placeholder: "Empty description"
      - name: "keywords"
        field:
          element: "text"
          label: "Blog keywords"
          placeholder: "None keywords"
      - name: "layout"
        field:
          element: "hidden"
          value: "post"
```

这里有个注意的东西，就是 `title`，官方特地做了这么个功能，如果字段为 `title` 那么会自动抽取其作为文件名，本来很好的一个功能

但是，**不支持中文**，也就是说你新建博客的时候，如果标题都是中文，那么文件名是空的(有日期部分)，详见 [Issue](https://github.com/prose/prose/issues/1000)

所以我去掉了这个功能，新建博客的时候需要手动在 `Raw Metadata` 添加 `title: ***` 这种东西；不过还好，这东西在修改博客的时候是默认启用的


### 测试

可以访问这个看下效果：[Admin](https://www.dosk.win/admin/)
