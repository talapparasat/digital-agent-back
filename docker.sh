# run this after setting up the docker-compose This will instantiate the replica set.
# The id and hostname's can be tailored to your liking, however they MUST match the docker-compose file above.

#!/bin/bash
docker-compose up -d
sleep 30 | echo Sleeping
mongo mongodb://localhost:27020 ./setup/replicaSet.js
