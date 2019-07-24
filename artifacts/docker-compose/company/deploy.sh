
sleep  1
docker stack deploy -c ca.yaml ca
sleep 1
docker stack deploy -c couchdb.yaml couchdb
sleep 1
docker stack deploy -c peer0.yaml peer0
sleep 1
docker stack deploy -c orderer2.yaml orderer2
sleep 1
docker stack deploy -c orderer3.yaml orderer3
