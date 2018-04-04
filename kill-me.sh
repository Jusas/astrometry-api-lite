#!/bin/bash

# A utility to kill other node processes we've spawned before starting a new one.
# Needed because when a bash window closes in Windows 10, node processes
# are not terminated until the last bash window is closed.
# That is why we run this script first before starting any new
# node process.

procs=$(ps -ef | grep node | grep 'dist/api/server\|dist/manager/main' | awk '{print $8,$2}' | grep node | awk '{print $2}')
if [ ! -z "$procs" ]; then
	echo $procs | xargs kill
fi

