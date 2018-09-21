# Local
mosh kj

# Remote
cd ~/kings-journey/
git pull
tsc
kill `pgrep ruby`
sleep 2 # wait for shutdown
sequel -m migrations sqlite://data.db
nohup ruby server.rb -p 80 -o 188.166.92.132 >> game.log 2>&1 &
exit

# Local
open http://kj-alpha.vrinek.io/games/new
