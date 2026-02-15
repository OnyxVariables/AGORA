El archivo qbftConfigFile.json sirve para generar el archivo genesis.json que contiene las reglas para todos los nodos como:
protocolo, identificador de la red, parámetros técnicos...

Para generar el archivo genesis.json y claves públicas / privada de cada nodo ejecutar desde Powershell estando en el 
directorio /QBFT-Network:
docker run --rm -v ${PWD}:/data hyperledger/besu:latest operator generate-blockchain-config --config-file=/data/config/qbftConfigFile.json --to=/data/networkFiles --private-key-file-name=key

Copiar las claves a cada carpeta Node correspondiente y genesis.json a la raíz. El compose levanta todo los nodos y se conectan entre ellos gracias a static-nodes.json que contiene las claves
públicas de cada uno de ellos. Las claves privadas nunca se suben ya que gracias a ellas un nodo es válido para conectarse a los demás.