---
layout: post
filename: Kubernetes-ji-qun-dao-hang-ye
title: Kubernetes 集群导航页
categories:
  - code
  - work
description: homelab 自建服务导航的另类思路
keywords: kubernetes, k8s, homelab, caddy, kubectl
---
## 引

* 我在家里的服务，都是基于 `k8s` 来部署的，抛开复杂度看，能够以统一的方式控制所有机器并灵活调度的特性深得我心。
* 不过，像所有人一样，我也希望能让所有的入口统一起来，也就是各个玩家都会搭建的导航页；鉴于 `k8s` 具备了很强大的 `api-server` 所以我决定基于其上搞个简单的导航页。

## 组件

> 简单介绍下我用到的组件，如果觉得还行的话，其实可以拉代码简单适配自己的设施

1. `ingress` 我选择的是 `traefik`，这部分其实只要你喜欢，可以随便换
2. 我所有的服务，都具备独立的子域名，用 `cert-manager` 管理证书，所以我新增服务只要按照模板写一下配置就轻松跑起来
3. 导航页是域名根域

## 玩法

1. 现在已经整理成一个镜像，最初是直接跑了一个 `kubectl` 来作为 `api-server` 的 `proxy`，配合 `caddy` 来做反向代理
2. `caddy` 还负责作为静态资源服务器，我的所有逻辑都是前端完成，`frontend -> caddy -> kubectl -> api-server`
3. 所有的 `ingress` 资源我都使用 `annotations` 来添加自定义字段，字段都以 `homelab` 开头，以 `jellyfin` 举例：

```yaml
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: jellyfin
  annotations:
    kubernetes.io/ingress.class: traefik
    homelab/name: Jellyfin # 导航页上显示的名字
    homelab/host: jellyfin # 子域名前缀
    homelab/order: "33"    # 顺序，就是个排序的作用
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`jellyfin.dosk.host`)
      kind: Rule
      services:
        - name: jellyfin
          port: 8096
```

## 代码

> 这部分相对就复杂些了，不过，可以直接参考我封装好的代码 [Infinity-Server/dockerset](https://github.com/Infinity-Server/dockerset/tree/main/aura) 或镜像 [docker.io/springhack/aura](https://hub.docker.com/r/springhack/aura)

* `caddy` 的代码，反向代理了 `kubectl proxy` 并提供 `file-server`：

```
:8000 {
  handle_path /services {
    rewrite * "/apis/{env.API_GROUP}/{env.API_VERSION}/{env.API_CRD}"
    reverse_proxy 127.0.0.1:6000 {
      header_up Host {upstream_hostport}
    }
  }
  file_server * {
    root /etc/caddy
  }
}
```

* 其他部分的代码，其实就相对简单了，可以直接参考仓库

## 那么我的镜像如何使用呢

> 简单，如下：

* 首先配置一个 `ServiceAccount`，我都放在了独立的 `aura namespace` 下面：

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: aura
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: aura-role
  namespace: aura
rules:
  - apiGroups:
      - ""
      - "traefik.io"
      - "metrics.k8s.io"  # 这部分，是因为镜像添加了 metrics 信息显示
    resources:
      - "pods"            # 同上
      - "nodes"           # 同上
      - "ingressroutes"
    verbs:
      - "get"
      - "list"
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: aura-binding
  namespace: aura
subjects:
  - kind: ServiceAccount
    name: aura-account
    namespace: aura
roleRef:
  kind: ClusterRole
  name: aura-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: aura-account
  namespace: aura
```

* 然后，部署一个 `Deployment`，配合这个 `ServiceAccount`：

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aura
  namespace: aura
  labels:
    app: aura
spec:
  revisionHistoryLimit: 0
  selector:
    matchLabels:
      app: aura
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: aura
    spec:
      serviceAccountName: aura-account
      containers:
        - image: springhack/aura:latest
          imagePullPolicy: IfNotPresent
          name: aura
          ports:
            - containerPort: 8000
              name: aura
```

* 其余部分按照喜好补全就好之后，只要你部署的 `ingress` 带有相应 `annotations` 就会被自动显示到首页上并按照 `order` 排序

## 还有么

* 提一嘴，镜像代码配置了环境变量，如果只是更换 `ingress controller` 几乎可以不用改代码
* 最后放个图吧，我知道我的代码，现在还较为简单，毕竟只是我个人在用，放出来更多的是为大家提供一个思路

![](/uploads/screenshot-20231229-205632.png)