---
layout: post
categories:
  - code
published: true
description: CPU Usage 统计的实现
keywords: 'cpu,usage,counter'
title: macOS & Windows 实现系统/进程/线程的 CPU 统计
---
## 测试代码

```cpp
// CPU Usage
cpu_usage::start_thread_counter();
cpu_usage::start_counter();
while (1) {
  usleep(1000000);
  auto cpu_t = cpu_usage::thread_cpu_usage();
  cout << cpu_usage::proc_cpu_usage() << endl;
  for (const auto& t : cpu_t) {
    cout << t.thread_id << " " << t.thread_name << " " << t.cpu_usage << endl;
  }
  cout << "--------------------" << endl;
}
```

## 头文件定义

```cpp
/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2019-12-26 15:27:13
 *  Filename: src/utils/cpu_usage.hpp
 *  Description: Created by SpringHack using vim automatically.
 */
#ifndef _CPU_USAGE_HPP_HEADER_
#define _CPU_USAGE_HPP_HEADER_

#include <iostream>
#include <sstream>
#include <iomanip>
#include <string>
#include <mutex>
#include <thread>
#include <vector>
#include <map>


namespace cpu_usage {

class system_info {
public:
  double user_cpu_usage;
  double idle_cpu_usage;
  double system_cpu_usage;
  system_info(double u, double s, double i);
};

class thread_info {
public:
  std::string thread_name;
  unsigned long int thread_id;
  double cpu_usage;
  thread_info(std::string name, unsigned long int id, double cpu);
};

uint64_t get_interval();

void set_interval(uint64_t x);

void start_counter();

void stop_counter();

void start_thread_counter();

void stop_thread_counter();

system_info sys_cpu_usage();

double proc_cpu_usage();

std::vector<thread_info> thread_cpu_usage();

static inline double double_round(double number, unsigned int bits) {
  std::stringstream ss;
  ss << std::fixed << std::setprecision(bits) << number;
  ss >> number;
  return number;
}

} // namespace cpu_usage
#endif // _CPU_USAGE_HPP_HEADER_
```

## macOS 实现

```cpp
/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2019-12-26 18:02:27
 *  Filename: cpu_usage_mac.cc
 *  Description: Created by SpringHack using vim automatically.
 */
#include "cpu_usage.hpp"

#include <fcntl.h>
#include <mach/mach.h>
#include <mach/mach_error.h>
#include <mach/mach_host.h>
#include <mach/mach_init.h>
#include <mach/mach_port.h>
#include <mach/processor_info.h>
#include <mach/semaphore.h>
#include <mach/task.h>
#include <mach/thread_act.h>
#include <mach/thread_info.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <sys/sysctl.h>
#include <sys/types.h>
#include <inttypes.h>
#include <unistd.h>

#define LOCK(X) std::lock_guard<std::mutex> s_cpu_usage_guard(X);

namespace cpu_usage {

system_info::system_info(double u, double s, double i)
      : user_cpu_usage(u), idle_cpu_usage(i), system_cpu_usage(s) {}

thread_info::thread_info(std::string name, unsigned long int id, double cpu)
      : thread_name(name), thread_id(id), cpu_usage(cpu) {}

bool counter_started = false;
bool thread_counter_started = false;
uint64_t counter_interval = 1000;
double _proc_cpu = 0.0f;
std::vector<thread_info> _thread_cpus;
system_info _sys_cpu(0, 0, 0);
std::thread g_counter_worker;
std::mutex g_cpu_usage_mutex;
void worker();

uint64_t get_interval() {
  LOCK(g_cpu_usage_mutex)
  return counter_interval;
}

void set_interval(uint64_t x) {
  LOCK(g_cpu_usage_mutex)
  counter_interval = x;
}

void start_counter() {
  if (counter_started)
    return;
  {
    LOCK(g_cpu_usage_mutex)
    counter_started = true;
  }
  g_counter_worker = std::thread(worker);
  g_counter_worker.detach();
}

void stop_counter() {
  if (!counter_started)
    return;
  {
    LOCK(g_cpu_usage_mutex)
    counter_started = false;
  }
}

void start_thread_counter() {
	if (thread_counter_started) return;
	LOCK(g_cpu_usage_mutex);
	thread_counter_started = true;
}

void stop_thread_counter() {
	if (!thread_counter_started) return;
	LOCK(g_cpu_usage_mutex);
	thread_counter_started = false;
}

system_info sys_cpu_usage() {
  LOCK(g_cpu_usage_mutex)
  return _sys_cpu;
}

double proc_cpu_usage() {
  LOCK(g_cpu_usage_mutex)
  return _proc_cpu;
}

std::vector<thread_info> thread_cpu_usage() {
  LOCK(g_cpu_usage_mutex)
  return _thread_cpus;
}

static void cpu_percent(unsigned long long ticks, unsigned long long totalticks,
                        unsigned long long *whole, unsigned long long *part) {
  *whole = 100ULL * ticks / totalticks;
  *part = (((100ULL * ticks) - (*whole * totalticks)) * 100ULL) / totalticks;
}

double uint64_percent(uint64_t whole, uint64_t part) {
  double retval;
  char buf[128];
  sprintf(buf, "%" PRIu64 ".%" PRIu64, whole, part);
  sscanf(buf, "%lf", &retval);
  return retval;
}

void worker() {
  bool continue_work = true;
  bool _thread_counter_started = thread_counter_started;
  pthread_setname_np("ele_ex_cpu_counter");
  task_t this_task;
  kern_return_t rt = task_for_pid(mach_task_self(), getpid(), &this_task);
  const task_t host_task = mach_host_self();
  while (continue_work) {
    // thread & process cpu usage
    std::vector<thread_info> tmp_thread_cpus;
    thread_act_array_t threads;
    mach_msg_type_number_t thread_count = 0;
    kern_return_t kr = task_threads(this_task, &threads, &thread_count);
    double tmp_proc_cpu = 0.0f;
    system_info tmp_sys_cpu(0, 0, 0);
    if (kr == KERN_SUCCESS) {
      for (int i = 0; i < thread_count; ++i) {
        thread_act_t thread = threads[i];
        mach_msg_type_number_t count = THREAD_INFO_MAX;
        thread_basic_info_data_t info;
        kr = ::thread_info(thread, THREAD_BASIC_INFO, (thread_info_t)&info,
                           &count);
        if (kr == KERN_SUCCESS) {
          float cpu = info.cpu_usage;
          tmp_proc_cpu += cpu;
          if (_thread_counter_started) {
            pthread_t pt = pthread_from_mach_thread_np(thread);
            char name[256] = {0};
            if (pt) {
              pthread_getname_np(pt, name, sizeof(name));
              if (strlen(name) == 0) {
                sprintf(name, "thread_%d", i + 1);
              } else {
                sprintf(name, "%s(%d)", name,
                        i + 1); // only use out buffer as args while it's fitst arg
              }
            }
            tmp_thread_cpus.push_back(
                thread_info(name, threads[i], cpu / TH_USAGE_SCALE * 100));
          }
        }
      }
    }
    vm_deallocate(this_task, (vm_offset_t)threads,
                  thread_count * sizeof(thread_t));
    // sys cpu usage
    mach_msg_type_number_t count;
    count = HOST_CPU_LOAD_INFO_COUNT;
    static bool pre_get_cpu_load = false;
    static host_cpu_load_info_data_t p_load;
    host_cpu_load_info_data_t load;
    unsigned long long userticks, systicks, idleticks, totalticks;
    unsigned long long userwhole, userpart, syswhole, syspart, idlewhole,
        idlepart;
    kr = host_statistics(host_task, HOST_CPU_LOAD_INFO, (host_info_t)&load,
                         &count);
    if (!pre_get_cpu_load) {
      pre_get_cpu_load = true;
      p_load = load;
    } else {
      userticks =
          load.cpu_ticks[CPU_STATE_USER] + load.cpu_ticks[CPU_STATE_NICE];
      systicks = load.cpu_ticks[CPU_STATE_SYSTEM];
      idleticks = load.cpu_ticks[CPU_STATE_IDLE];
      userticks -=
          (p_load.cpu_ticks[CPU_STATE_USER] + p_load.cpu_ticks[CPU_STATE_NICE]);
      systicks -= p_load.cpu_ticks[CPU_STATE_SYSTEM];
      idleticks -= p_load.cpu_ticks[CPU_STATE_IDLE];
      totalticks = userticks + systicks + idleticks;
      if (0 != totalticks) {
        cpu_percent(userticks, totalticks, &userwhole, &userpart);
        cpu_percent(systicks, totalticks, &syswhole, &syspart);
        cpu_percent(idleticks, totalticks, &idlewhole, &idlepart);
        tmp_sys_cpu = system_info(uint64_percent(userwhole, userpart), uint64_percent(syswhole, syspart), uint64_percent(idlewhole, idlepart));
      }
    }
    // lock and change global vars
    {
      LOCK(g_cpu_usage_mutex)
      _thread_cpus = tmp_thread_cpus;
      _proc_cpu = tmp_proc_cpu / TH_USAGE_SCALE * 100;
      _sys_cpu = tmp_sys_cpu;
      _thread_counter_started = thread_counter_started;
      continue_work = counter_started;
    }
    usleep(1000 * counter_interval);
  }
}

}
```

## Windows 实现

```cpp
/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-02-22 02:22:48
 *  Filename: cpu_usage_win.cc
 *  Description: Created by SpringHack using vim automatically.
 */
#include "cpu_usage.hpp"

#include <atlbase.h>
#include <windows.h>
#include <dbghelp.h>
#include <tlhelp32.h>
#pragma comment(lib, "dbghelp.lib")
#define NUMBER_OF_PROCESSORS (16)
#define PROCESSOR_BUFFER_SIZE (NUMBER_OF_PROCESSORS * 8)
#define STATUS_SUCCESS ((NTSTATUS)0x00000000L)
typedef enum _THREADINFOCLASS {
  ThreadBasicInformation,
  ThreadTimes,
  ThreadPriority,
  ThreadBasePriority,
  ThreadAffinityMask,
  ThreadImpersonationToken,
  ThreadDescriptorTableEntry,
  ThreadEnableAlignmentFaultFixup,
  ThreadEventPair_Reusable,
  ThreadQuerySetWin32StartAddress,
  ThreadZeroTlsCell,
  ThreadPerformanceCount,
  ThreadAmILastThread,
  ThreadIdealProcessor,
  ThreadPriorityBoost,
  ThreadSetTlsArrayAddress,   // Obsolete
  ThreadIsIoPending,
  ThreadHideFromDebugger,
  ThreadBreakOnTermination,
  ThreadSwitchLegacyState,
  ThreadIsTerminated,
  ThreadLastSystemCall,
  ThreadIoPriority,
  ThreadCycleTime,
  ThreadPagePriority,
  ThreadActualBasePriority,
  ThreadTebInformation,
  ThreadCSwitchMon,
  ThreadCSwitchPmu,
  ThreadWow64Context,
  ThreadGroupInformation,
  ThreadUmsInformation,
  ThreadCounterProfiling,
  ThreadIdealProcessorEx,
  MaxThreadInfoClass
} THREADINFOCLASS;
typedef NTSTATUS (WINAPI *pNtQIT)(IN HANDLE ThreadHandle, IN THREADINFOCLASS ThreadInformationClass, OUT PVOID ThreadInformation, IN ULONG ThreadInformationLength, OUT PULONG ReturnLength);
typedef HRESULT (WINAPI *pSetTD)(HANDLE hThread, PCWSTR lpThreadDescription);
typedef HRESULT (WINAPI *pGetTD)(HANDLE hThread, PCWSTR *lpThreadDescription);

#define LOCK(X) std::lock_guard<std::mutex> s_cpu_usage_guard(X);

namespace cpu_usage {

  system_info::system_info(double u, double s, double i)
    : user_cpu_usage(u), idle_cpu_usage(i), system_cpu_usage(s) {}

  thread_info::thread_info(std::string name, unsigned long int id, double cpu)
    : thread_name(name), thread_id(id), cpu_usage(cpu) {}

  bool counter_started = false;
  bool thread_counter_started = false;
  uint64_t counter_interval = 1000;
  double _proc_cpu = 0.0f;
  std::vector<thread_info> _thread_cpus;
  system_info _sys_cpu(0, 0, 0);
  std::thread g_counter_worker;
  std::mutex g_cpu_usage_mutex;
  void worker();

  uint64_t get_interval() {
    LOCK(g_cpu_usage_mutex)
      return counter_interval;
  }

  void set_interval(uint64_t x) {
    LOCK(g_cpu_usage_mutex)
      counter_interval = x;
  }

  void start_counter() {
    if (counter_started)
      return;
    {
      LOCK(g_cpu_usage_mutex)
        counter_started = true;
    }
    g_counter_worker = std::thread(worker);
    g_counter_worker.detach();
  }

  void stop_counter() {
    if (!counter_started)
      return;
    {
      LOCK(g_cpu_usage_mutex)
        counter_started = false;
    }
  }

  void start_thread_counter() {
    if (thread_counter_started) return;
    LOCK(g_cpu_usage_mutex);
    thread_counter_started = true;
  }

  void stop_thread_counter() {
    if (!thread_counter_started) return;
    LOCK(g_cpu_usage_mutex);
    thread_counter_started = false;
  }

  system_info sys_cpu_usage() {
    LOCK(g_cpu_usage_mutex)
      return _sys_cpu;
  }

  double proc_cpu_usage() {
    LOCK(g_cpu_usage_mutex)
      return _proc_cpu;
  }

  std::vector<thread_info> thread_cpu_usage() {
    LOCK(g_cpu_usage_mutex)
      return _thread_cpus;
  }

  using namespace std;

  // Private APIs
  uint64_t _filetime_to_u64(FILETIME filetime) {
    return (((uint64_t)filetime.dwHighDateTime << 32) | (uint64_t)filetime.dwLowDateTime) / 10;
  }

  void _get_sys_times(uint64_t* idle, uint64_t* kernel, uint64_t* user) {
    FILETIME _idle, _kernel, _user;
    GetSystemTimes(&_idle, &_kernel, &_user);
    *idle = _filetime_to_u64(_idle);
    *kernel = _filetime_to_u64(_kernel);
    *user = _filetime_to_u64(_user);
  }

  bool _get_process_times(uint32_t pid, uint64_t* kernel, uint64_t* user) {
    static HANDLE handler = OpenProcess(PROCESS_QUERY_INFORMATION, 0, pid);
    if (!handler) return false;
    FILETIME create_time, exit_time, kernel_time, user_time;
    int ret = GetProcessTimes(handler, &create_time, &exit_time, &kernel_time, &user_time);
    if (ret == 0) return false;
    *kernel = _filetime_to_u64(kernel_time);
    *user = _filetime_to_u64(user_time);
    return true;
  }

  bool _get_thread_times(uint32_t tid, uint64_t* kernel, uint64_t* user) {
    HANDLE handler = OpenThread(THREAD_QUERY_INFORMATION, 0, tid);
    if (!handler) return false;
    FILETIME create_time, exit_time, kernel_time, user_time;
    int ret = GetThreadTimes(handler, &create_time, &exit_time, &kernel_time, &user_time);
    CloseHandle(handler);
    if (ret == 0) return false;
    *kernel = _filetime_to_u64(kernel_time);
    *user = _filetime_to_u64(user_time);
    return true;
  }

  template <typename Func>
    void _get_times(Func func, uint32_t id, uint64_t* pwork_time, uint64_t* total_time) {
      uint64_t sys_idle, sys_kernel, sys_user;
      _get_sys_times(&sys_idle, &sys_kernel, &sys_user);
      uint64_t pro_kernel, pro_user;
      func(id, &pro_kernel, &pro_user);
      *pwork_time = pro_kernel + pro_user;
      *total_time = sys_kernel + sys_user;
    }

  DWORD WINAPI _get_thread_start_ddress(HANDLE hThread) {
    NTSTATUS ntStatus;
    HANDLE hDupHandle;
    DWORD dwStartAddress;
    static pNtQIT NtQueryInformationThread = (pNtQIT)GetProcAddress(GetModuleHandle("ntdll.dll"), "NtQueryInformationThread");
    if (NtQueryInformationThread == NULL) return 0;
    HANDLE hCurrentProcess = GetCurrentProcess();
    if (!DuplicateHandle(hCurrentProcess, hThread, hCurrentProcess, &hDupHandle, THREAD_QUERY_INFORMATION, FALSE, 0)) {
      SetLastError(ERROR_ACCESS_DENIED);
      return 0;
    }
    ntStatus = NtQueryInformationThread(hDupHandle, ThreadQuerySetWin32StartAddress, &dwStartAddress, sizeof(DWORD), NULL);
    CloseHandle(hDupHandle);
    if (ntStatus != STATUS_SUCCESS) return 0;
    return dwStartAddress;
  }

  string _get_symbol_name_by_address(DWORD dwAddress, uint64_t index) {
    static HANDLE hProcess = GetCurrentProcess();
    static BOOL inited = SymInitialize(hProcess, nullptr, TRUE);
    DWORD64 dwDisplacement = 0;
    char buffer[sizeof(SYMBOL_INFO) + MAX_SYM_NAME * sizeof(TCHAR)];
    PSYMBOL_INFO pSymbol = (PSYMBOL_INFO)buffer;
    pSymbol->SizeOfStruct = sizeof(SYMBOL_INFO);
    pSymbol->MaxNameLen = MAX_SYM_NAME;
    if (SymFromAddr(hProcess, dwAddress, &dwDisplacement, pSymbol)) {
      return string(pSymbol->Name) + "(" + to_string(index) + ")";
    } else {
      DWORD error = GetLastError();
      return "";
    }
  }

  string _w_to_a(PCWSTR w_str) {
    USES_CONVERSION;
    string retval(W2A(w_str));
    return retval;
  }

  string _get_thread_description(HANDLE hThread, uint64_t index) {
    static pGetTD _GetThreadDescription = (pGetTD)GetProcAddress(GetModuleHandle("kernel32.dll"), "GetThreadDescription");
    if (_GetThreadDescription == NULL) return "";
    PCWSTR name;
    HRESULT hr = _GetThreadDescription(hThread, &name);
    if (FAILED(hr)) return "";
    string retval;
    string argval = _w_to_a(name);
    stringstream convertor;
    convertor << argval;
    convertor >> retval;
    if (retval.empty()) return retval;
    return retval + "(" + to_string(index) + ")";
  }

  vector<thread_info> _get_all_threads() {
    vector<thread_info> threads;
    uint64_t pid = GetCurrentProcessId();
    HANDLE h = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, pid);
    uint64_t index = 1;
    if (h != INVALID_HANDLE_VALUE) {
      THREADENTRY32 te;
      te.dwSize = sizeof(te);
      if (Thread32First(h, &te)) {
        do {
          if (te.dwSize >= FIELD_OFFSET(THREADENTRY32, th32OwnerProcessID) + sizeof(te.th32OwnerProcessID)) {
            if (te.th32OwnerProcessID == pid) {
              HANDLE hThread = OpenThread(THREAD_QUERY_INFORMATION, 0, te.th32ThreadID);
              string thread_name = _get_thread_description(hThread, index);
              if (thread_name.empty()) {
                DWORD addr = _get_thread_start_ddress(hThread);
                thread_name = _get_symbol_name_by_address(addr, index);
              }
              CloseHandle(hThread);
              if (thread_name.empty()) {
                thread_name = "thread " + to_string(index);
              }
              ++index;
              threads.push_back(thread_info(thread_name, te.th32ThreadID, 0));
            }
          }
          te.dwSize = sizeof(te);
        } while (Thread32Next(h, &te));
      }
      CloseHandle(h);
    }
    return threads;
  }

  void _get_sys_cpu(double& idle, double& user) {
    static ULONG64 ProcessorIdleTimeBuffer[PROCESSOR_BUFFER_SIZE];

    FILETIME IdleTime, KernelTime, UserTime;
    static unsigned long long PrevTotal = 0;
    static unsigned long long PrevIdle = 0;
    static unsigned long long PrevUser = 0;
    unsigned long long ThisTotal;
    unsigned long long ThisIdle, ThisKernel, ThisUser;
    unsigned long long TotalSinceLast, IdleSinceLast, UserSinceLast;

    GetSystemTimes(&IdleTime, &KernelTime, &UserTime);

    ThisIdle = _filetime_to_u64(IdleTime);
    ThisKernel = _filetime_to_u64(KernelTime);
    ThisUser = _filetime_to_u64(UserTime);

    ThisTotal = ThisKernel + ThisUser;
    TotalSinceLast = ThisTotal - PrevTotal;
    IdleSinceLast = ThisIdle - PrevIdle;
    UserSinceLast = ThisUser - PrevUser;
    double Headroom;
    Headroom = (double)IdleSinceLast / (double)TotalSinceLast;
    double Load;
    Load = 1.0 - Headroom;
    Headroom *= 100.0;  // to make it percent
    Load *= 100.0;  // percent

    PrevTotal = ThisTotal;
    PrevIdle = ThisIdle;
    PrevUser = ThisUser;

    idle = Headroom;
    user = Load;
  }

  void worker() {
    bool continue_work = true;
    bool _thread_counter_started = thread_counter_started;
    uint64_t p_p_work = 0, p_p_total = 0;
    map<uint64_t, uint64_t> p_tid_work;
    map<uint64_t, uint64_t> p_tid_total;
    static pSetTD _SetThreadDescription = (pSetTD)GetProcAddress(GetModuleHandle("kernel32.dll"), "SetThreadDescription");
    if (_SetThreadDescription != NULL) {
      _SetThreadDescription(GetCurrentThread(), L"ele_ex_cpu_counter");
    }
    while (continue_work) {
      // sys cpu
      double idle = 0.0f, user = 0.0f;
      _get_sys_cpu(idle, user);
      system_info tmp_sys_cpu(user, 0, idle);
      // process cpu
      uint64_t p_work = 0, p_total = 0;
      double tmp_proc_cpu = 0.0f;
      _get_times(_get_process_times, GetCurrentProcessId(), &p_work, &p_total);
      uint64_t dt_work = p_work - p_p_work;
      uint64_t dt_total = p_total - p_p_total;
      if (dt_total != 0) {
        tmp_proc_cpu = (double)dt_work * 100 / (double)dt_total;
      }
      p_p_work = p_work;
      p_p_total = p_total;
      // threads
      if (_thread_counter_started) {
        vector<thread_info> tmp_thread_cpus = _get_all_threads();
        map<uint64_t, uint64_t> tid_work;
        map<uint64_t, uint64_t> tid_total;
        for (thread_info &thread: tmp_thread_cpus) {
          uint64_t tid = thread.thread_id;
          uint64_t work = 0, total = 0;
          _get_times(_get_thread_times, tid, &work, &total);
          uint64_t dt_work = work;
          uint64_t dt_total = total;
          if (p_tid_work[tid]) dt_work -= p_tid_work[tid];
          if (p_tid_total[tid]) dt_total -= p_tid_total[tid];
          if (dt_total != 0) {
            double thread_cpu = (double)dt_work * 100 / (double)dt_total;
            thread.cpu_usage = thread_cpu;
          }
          tid_work[tid] = work;
          tid_total[tid] = total;
        }
        p_tid_work = tid_work;
        p_tid_total = tid_total;

        LOCK(g_cpu_usage_mutex)
        _thread_cpus = tmp_thread_cpus;
      }
      // lock and change global vars
      {
        LOCK(g_cpu_usage_mutex)
          _sys_cpu = tmp_sys_cpu;
        _proc_cpu = tmp_proc_cpu;
        continue_work = counter_started;
        _thread_counter_started = thread_counter_started;
      }
      cpu_time::cpu_time_counter(_proc_cpu);
      Sleep(counter_interval);
    }
  }

}
```