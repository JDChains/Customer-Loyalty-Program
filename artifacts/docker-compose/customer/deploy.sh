
docker stack deploy -c zk.yaml zk
sleep 1
docker stack deploy -c ca.yaml ca
sleep 1
docker stack deploy -c couchdb.yaml couchdb
sleep 1
docker stack deploy -c peer0.yaml peer0
sleep 1
docker stack deploy -c kafka.yaml kafka
sleep 1
docker stack deploy -c orderer1.yaml orderer1
