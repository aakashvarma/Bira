from queue import Queue
from subprocess import PIPE, Popen
from threading import Thread
import shlex
import os

def read(pipe, funcs):
    for line in iter(pipe.readline, b''):
        for func in funcs:
            func(line.decode("utf-8"))
    pipe.close()

def write(get):
    for line in iter(get, None):
        print(line)


def execute(command):

    process = Popen(
        command,
        cwd=None,
        shell=False,
        close_fds=True,
        stdout=PIPE,
        stderr=PIPE,
        bufsize=1
    )

    output, errors = [], []
    pipe_queue = Queue() 

    
    stdout_thread = Thread(target=read, args=(process.stdout, [pipe_queue.put, output.append]))
    stderr_thread = Thread(target=read, args=(process.stderr, [pipe_queue.put, errors.append]))

    writer_thread = Thread(target=write, args=(pipe_queue.get,)) 

    
    for thread in (stdout_thread, stderr_thread, writer_thread):
        thread.daemon = True
        thread.start()

    process.wait()

    for thread in (stdout_thread, stderr_thread):
        thread.join()

    pipe_queue.put(None)

    output = ' '.join(output)
    errors = ' '.join(errors)


print(os.getcwd())
file_path = ["testprocesss"]
language = "python3"
execute([language] + file_path)