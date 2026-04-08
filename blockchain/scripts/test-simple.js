const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Probando SimpleVoting");

  // Leer último archivo de despliegue
  const deploymentFiles = fs.readdirSync('./').filter(f => f.startsWith('deployment-simple-'));
  if (deploymentFiles.length === 0) {
    console.log("No se encontró archivo de despliegue. Ejecuta primero 'deploy-simple.js'");
    return;
  }

  const latestDeployment = deploymentFiles.sort().pop();
  const deploymentInfo = JSON.parse(fs.readFileSync(latestDeployment, 'utf8'));
  console.log("Usando despliegue:", latestDeployment);

  // Conectar al contrato
  const [signer] = await ethers.getSigners();
  const SimpleVoting = await ethers.getContractFactory("SimpleVoting");
  const simpleVoting = SimpleVoting.attach(deploymentInfo.contracts.SimpleVoting);

  console.log("Contrato conectado en:", deploymentInfo.contracts.SimpleVoting);
  console.log("Cuenta:", signer.address);

  try {
    // 1. Ver información del contrato
    console.log("\n=== INFORMACIÓN DEL CONTRATO ===");
    const admin = await simpleVoting.admin();
    console.log("Admin:", admin);
    console.log("Nota: El contrato solo registra acciones, no tiene funciones de lectura, esto se hará con Spring Boot");

    // 2. Obtener el contador actual de votaciones
    console.log("\n=== VERIFICAR CONTADOR ACTUAL ===");
    
    // 3. Crear votación NUEVA (el contador se incrementa automáticamente)
    console.log("\n=== CREAR NUEVA VOTACIÓN ===");
    
    // Obtener el timestamp actual del bloque
    const provider = ethers.provider;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const blockTimestamp = block.timestamp;
    
    console.log("Timestamp del bloque:", blockTimestamp);
    console.log("Timestamp del script:", Math.floor(Date.now() / 1000));
    
    const tx1 = await simpleVoting.createVotation(
      "Elecciones Test 2024",
      "Votación de prueba interactiva",
      blockTimestamp, // startDate = timestamp del bloque
      blockTimestamp + 7200 // endDate = timestamp del bloque + 2 horas (margen grande)
    );
    const receipt1 = await tx1.wait();
    
    // Extraer el ID de la votación creada desde el evento
    let newVotationId = null;
    for (const log of receipt1.logs) {
      try {
        const parsed = simpleVoting.interface.parseLog(log);
        if (parsed.name === 'VotationCreated') {
          newVotationId = parsed.args[0];
          break;
        }
      } catch (e) { continue; }
    }
    
    console.log("Votación creada con ID:", newVotationId?.toString());
    console.log("Inicio:", new Date(blockTimestamp * 1000).toLocaleString());
    console.log("Fin:", new Date((blockTimestamp + 7200) * 1000).toLocaleString());
    console.log("Transaction:", tx1.hash);
    console.log("Gas usado:", receipt1.gasUsed.toString());

    // 4. Enviar votos en la votación RECÍEN CREADA
    console.log("\n=== ENVIAR VOTO ===");
    
    // Obtener timestamp actual para hashes únicos
    const currentBlock = await provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    
    const voteHash1 = ethers.keccak256(ethers.toUtf8Bytes(`voto_${currentTimestamp}_${newVotationId}_${Math.random()}_user1`));
    
    const tx4 = await simpleVoting.submitVote(
      1,              // partyId
      newVotationId,  // votationId
      5,              // municipalityId
      voteHash1       // voteHash único
    );
    const receipt4 = await tx4.wait();
    console.log("Voto enviado en votación", newVotationId?.toString());
    console.log("Transaction:", tx4.hash);
    console.log("Gas usado:", receipt4.gasUsed.toString());

    // 5. Enviar otro voto
    console.log("\n=== ENVIAR SEGUNDO VOTO ===");
    const voteHash2 = ethers.keccak256(ethers.toUtf8Bytes(`voto_${currentTimestamp}_${newVotationId}_${Math.random()}_user2`));
    const tx5 = await simpleVoting.submitVote(
      2,              // partyId
      newVotationId,  // votationId
      3,              // municipalityId
      voteHash2       // voteHash único
    );
    const receipt5 = await tx5.wait();
    console.log("Segundo voto enviado en votación", newVotationId?.toString());
    console.log("Transaction:", tx5.hash);
    console.log("Gas usado:", receipt5.gasUsed.toString());

    // 6. Actualizar la votación (pongo tiempo pasado para poder finalizar)
    console.log("\n=== ACTUALIZAR VOTACIÓN ===");
    const tx3 = await simpleVoting.updateVotation(
      newVotationId, // ID de la votación recién creada
      "Elecciones Test 2024 - Modificada",
      "Descripción actualizada de la votación",
      Math.floor(Date.now() / 1000) - 7200, // Empezó hace 2 horas
      Math.floor(Date.now() / 1000) - 3600, // Terminó hace 1 hora
      0 // VotationState.Active
    );
    const receipt3 = await tx3.wait();
    console.log("Votación actualizada (con tiempo pasado)");
    console.log("Transaction:", tx3.hash);
    console.log("Gas usado:", receipt3.gasUsed.toString());

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 7. Finalizar la votación
    console.log("\n=== FINALIZAR VOTACIÓN ===");
    const tx6 = await simpleVoting.finishVotation(newVotationId);
    const receipt6 = await tx6.wait();
    console.log("Votación finalizada");
    console.log("Transaction:", tx6.hash);
    console.log("Gas usado:", receipt6.gasUsed.toString());

    console.log("\nPRUEBA COMPLETADA!!!");
    console.log("Todos los eventos emitidos están listos para que Spring Boot los lea");
    console.log("Resumen de gas usado:");
    console.log(`- Crear votación: ${receipt1.gasUsed.toString()}`);
    console.log(`- Actualizar votación: ${receipt3.gasUsed.toString()}`);
    console.log(`- Enviar voto 1: ${receipt4.gasUsed.toString()}`);
    console.log(`- Enviar voto 2: ${receipt5.gasUsed.toString()}`);
    console.log(`- Finalizar votación: ${receipt6.gasUsed.toString()}`);

  } catch (error) {
    console.error("Error en la prueba:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
