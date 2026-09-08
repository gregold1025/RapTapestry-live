#!/usr/bin/env python3
"""Usage: analyze_trace.py trace.json[.gz] [t_start_ms t_end_ms] (relative to nav start; default whole trace)
Prints main-thread self-time by category (debugger noise separated), long tasks, and user timing marks."""
import gzip, json, sys, collections
path = sys.argv[1]
op = gzip.open if path.endswith('.gz') else open
d = json.load(op(path))
ev = d['traceEvents'] if isinstance(d, dict) else d
nav = [e for e in ev if e.get('name')=='navigationStart' and 'localhost' in json.dumps(e.get('args',{}))]
t0 = min(e['ts'] for e in nav) if nav else min(e['ts'] for e in ev if 'ts' in e)
w0 = float(sys.argv[2])*1000 if len(sys.argv)>2 else 0
w1 = float(sys.argv[3])*1000 if len(sys.argv)>3 else 1e15
cnt = collections.Counter((e['pid'],e['tid']) for e in ev if e.get('name')=='RunTask')
(pid,tid),_ = cnt.most_common(1)[0]
main = [e for e in ev if e.get('pid')==pid and e.get('tid')==tid and e.get('ph')=='X' and t0+w0 <= e['ts'] <= t0+w1]
DEBUG = {'v8::Debugger::AsyncTaskRun','V8Console::runTask','toFramesVector','AsyncStackTrace::capture','v8::Debugger::AsyncTaskScheduled','v8::Debugger::AsyncTaskCanceled','v8::Debugger::AsyncTaskFinished'}
def selftime(events):
    events = sorted(events, key=lambda e:(e['ts'], -e.get('dur',0)))
    st=[]; out=collections.Counter()
    for e in events:
        while st and st[-1]['ts']+st[-1].get('dur',0) <= e['ts']: st.pop()
        if st: out[st[-1]['name']] -= e.get('dur',0)
        out[e['name']] += e.get('dur',0)
        st.append(e)
    return out
s = selftime(main)
dbg = sum(v for n,v in s.items() if n in DEBUG)
tot = sum(v for n,v in s.items() if n not in DEBUG)
print(f"window {w0/1000:.0f}-{min(w1,(max(e['ts'] for e in main)-t0) if main else 0)/1000:.0f} ms | main-thread busy (excl. debugger) {tot/1000:.0f} ms | debugger overhead {dbg/1000:.0f} ms")
print("Top self-time (ms):")
for n,v in s.most_common(40):
    if n in DEBUG or v < 3000: continue
    print(f"  {v/1000:8.1f}  {n}")
tasks = sorted([e for e in main if e['name']=='RunTask' and e.get('dur',0)>50000], key=lambda e:e['ts'])
print("\nLong tasks (>50ms): start(ms)  dur(ms)")
for e in tasks: print(f"  {(e['ts']-t0)/1000:8.0f}  {e['dur']/1000:7.1f}")
marks = sorted([(e['ts']-t0, e['name']) for e in ev if e.get('ph') in ('R','I','n') and e.get('cat','')=='blink.user_timing' and e['ts']>=t0], key=lambda x:x[0])
print("\nUser timing marks (ms):")
for t,n in marks: print(f"  {t/1000:8.0f}  {n}")
