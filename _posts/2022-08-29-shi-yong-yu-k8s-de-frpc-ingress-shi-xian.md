---
layout: post
filename: shi-yong-yu-k8s-de-frpc-ingress-shi-xian
title: 适用于 k8s 的 frpc ingress 实现
categories:
  - code
description: 还很粗糙，不过我个人在用了
keywords: k8s, k3s, ingress, frp, frpc, 内网穿透
---
### Usage

- 我建立了一个 [`helm repo`](https://infinity-server.github.io/dockerset/) 用来快速部署，步骤如下

```shell
helm repo add infinity-server https://infinity-server.github.io/dockerset
helm repo update
helm upgrade --install frpc-ingress infinity-server/frpc-ingress 
```

- 现在等待所有东西跑起来就好，需要配置两个 `crd`：

1. 远端服务器信息，只能有一个的 `Config` 配置，其他信息酌情补充就好

```yaml
apiVersion: crds.dosk.host/v1alpha1
kind: FRPCIngress
metadata:
  name: common
spec:
  kind: Config
  config:
    - server_port = 7000        # frps 服务器端口
    - server_addr = 1.1.1.1     # frps 服务器地址
    # - foo = baz
```

2. `Rule` 配置，需要配和 `Service` 一起使用，如果有其他信息补充 `extraConfig` 字段即可：

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: demo-service
  labels:
    app: demo-service
spec:
  ports:
    - port: 53
      name: dns
      protocol: UDP
    - port: 8000
      name: http
      protocol: TCP
  selector:
    app: demo-service

---
apiVersion: crds.dosk.host/v1alpha1
kind: FRPCIngress
metadata:
  name: demo-service-dns-ingress
spec:
  kind: Rule
  service:
    name: demo-service
    port: 53
    protocol: UDP
    remotePort: 53

---
apiVersion: crds.dosk.host/v1alpha1
kind: FRPCIngress
metadata:
  name: demo-service-http-ingress
spec:
  kind: Rule
  service:
    name: demo-service
    port: 8000
    protocol: TCP
    remotePort: 8000
    # extraConfig:
    #   - foo = baz
```