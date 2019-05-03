from subprocess import Popen, PIPE

p1 = Popen(["python", "testprocesss.py"], stdout=PIPE)

print p1.communicate()