---
layout: post
title: 最少变量进行链表逆置，怕忘存档
categories: code
description: 指针异或的艺术
keywords: linked list
---

### 基本思路

> 简单的思路，就是首先交换 `root->next` 和 `revert_root` 的指向，此时已经逆置了一个元素

> 但是 `root` 和 `revert_root` 就反了，再交换下就 ok 了

### 直接上代码

```cpp
/*
        Author: SpringHack - springhack@live.cn
        Last modified: 2019-04-02 01:32:40
        Filename: main.c
        Description: Created by SpringHack using vim automatically.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Test data
int test_data[] = {
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10
};

// Node struct
typedef struct _node {
  int value;
  struct _node* next;
} node_item;
// Just easy to use malloc
typedef node_item* node;

// Define linked list root and reverted linked list root
// Only two variables needed to revert a linked list
static node root = NULL;
static node revert_root = NULL;

int main() {
  // Create linked list
  {
    int i = 0, count = sizeof(test_data) / sizeof(int);
    node tmp;
    while (i < count) {
      if (!root) {
        root = (node)malloc(sizeof(node_item));
        tmp = root;
      } else {
        tmp->next = (node)malloc(sizeof(node_item));
        tmp = tmp->next;
      }
      tmp->next = NULL;
      tmp->value = test_data[i];
      ++i;
    }
  }
  // Print linked list
  {
    node tmp = root;
    while (tmp) {
      printf(tmp->next ? "%d " : "%d", tmp->value);
      tmp = tmp->next;
    }
    printf("\n");
  }
  // Revert linked list
  {
    while (root) {
      if (!revert_root) {
        revert_root = root;
        root = root->next;
        revert_root->next = NULL;
      } else {
        revert_root = (node)((intptr_t)revert_root ^ (intptr_t)root->next);
        root->next = (node)((intptr_t)revert_root ^ (intptr_t)root->next);
        revert_root = (node)((intptr_t)revert_root ^ (intptr_t)root->next);
        revert_root = (node)((intptr_t)revert_root ^ (intptr_t)root);
        root = (node)((intptr_t)revert_root ^ (intptr_t)root);
        revert_root = (node)((intptr_t)revert_root ^ (intptr_t)root);
      }
    }
  }
  // Print reverted linked list
  {
    node tmp = revert_root;
    while (tmp) {
      printf(tmp->next ? "%d " : "%d", tmp->value);
      tmp = tmp->next;
    }
    printf("\n");
  }
  return 0;
}
```
