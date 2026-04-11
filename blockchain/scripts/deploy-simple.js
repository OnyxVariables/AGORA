const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Desplegando SimpleVoting");

  const [deployer] = await ethers.getSigners();
  console.log("Deploy con la cuenta:", deployer.address);
  
  // Arreglar el error de getBalance - usar provider
  const provider = ethers.provider;
  const balance = await provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  // Desplegar contrato
  const SimpleVoting = await ethers.getContractFactory("SimpleVoting");
  const simpleVoting = await SimpleVoting.deploy();
  await simpleVoting.waitForDeployment();

  // Obtener dirección correctamente
  const contractAddress = await simpleVoting.getAddress();
  console.log("SimpleVoting desplegado en:", contractAddress);

  // // Crear votación
  // console.log("\nCreando votación de ejemplo");
  // const tx = await simpleVoting.createVotation(
  //   "Elecciones Municipales 2026",
  //   "Votación de prueba de ejemplo",
  //   Math.floor(Date.now() / 1000),           // startDate ahora
  //   Math.floor(Date.now() / 1000) + 3600     // endDate +1 hora
  // );
  // const receipt = await tx.wait();
  
  // // Arreglar lectura de eventos
  // let votationId = null;
  // try {
  //   // Intentar parsear eventos
  //   for (const log of receipt.logs) {
  //     try {
  //       const parsed = simpleVoting.interface.parseLog(log);
  //       if (parsed.name === 'VotationCreated') {
  //         votationId = parsed.args[0];
  //         console.log("Evento VotationCreated encontrado");
  //         break;
  //       }
  //     } catch (e) {
  //       // Ignorar logs que no son del contrato
  //       continue;
  //     }
  //   }
  // } catch (error) {
  //   console.log("No se pudo parsear el evento, usando timestamp como ID");
  //   votationId = Math.floor(Date.now() / 1000);
  // }
  
  // console.log("Votación creada con ID:", votationId?.toString());
  // console.log("Transaction:", tx.hash);

  // Guardar info de despliegue
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId), // Convertir BigInt a Number o da fallo
    deployer: deployer.address,
    contracts: {
      SimpleVoting: contractAddress
    },
    // exampleVotation: votationId?.toString(),
    // transactionHash: tx.hash,
    // deployedAt: new Date().toISOString()
  };

  const fileName = `deployment-simple-${deploymentInfo.network}-${Date.now()}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  console.log("Info guardada en:", fileName);

  console.log("\n¡Despliegue completado!");
  console.log("Para probar el contrato, ejecuta:");
  console.log("npx hardhat run scripts/interact-simple.js --network localhost");
  console.log("o ejecuta el script automatizada:");
  console.log("npx hardhat run scripts/test-simple.js --network localhost");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en el despliegue:", error);
    process.exit(1);
  });