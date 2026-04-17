const { ethers } = require("hardhat");
const fs = require("fs");
const readline = require("readline");

async function main() {
  console.log("Interactuando con SimpleVoting");

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

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  function showMenu() {
    console.log("\nMenú SimpleVoting:");
    console.log("1. Crear nueva votación");
    console.log("2. Emitir voto");
    console.log("3. Actualizar votación");
    console.log("4. Cancelar votación");
    console.log("5. Finalizar votación");
    console.log("0. Salir");

    rl.question("Selecciona opción: ", async (choice) => {
      switch (choice) {
        case '1':
          await createVotation();
          break;
        case '2':
          await submitVote();
          break;
        case '3':
          await updateVotation();
          break;
        case '4':
          await cancelVotation();
          break;
        case '5':
          await finishVotation();
          break;
        case '0':
          console.log("Chao pescao!");
          rl.close();
          return;
        default:
          console.log("Opción inválida");
      }
      showMenu();
    });
  }

  async function createVotation() {
    rl.question("Título: ", async (title) => {
      rl.question("Descripción: ", async (desc) => {
        // Obtener timestamp del bloque
        const provider = ethers.provider;
        const block = await provider.getBlock("latest");
        const now = block.timestamp;
        const end = now + 3600; // +1 hora
        const votationId = now;
        try {
          const tx = await simpleVoting.createVotation(votationId, title, desc, now, end);
          const receipt = await tx.wait();
          
          // Extraer ID del evento
          let votationId = null;
          for (const log of receipt.logs) {
            try {
              const parsed = simpleVoting.interface.parseLog(log);
              if (parsed.name === 'VotationCreated') {
                votationId = parsed.args[0];
                break;
              }
            } catch (e) { continue; }
          }
          
          console.log("Votación creada con ID:", votationId?.toString());
          console.log("Inicio:", new Date(now * 1000).toLocaleString());
          console.log("Fin:", new Date(end * 1000).toLocaleString());
        } catch (error) {
          console.log("Error creando votación:", error.message);
        }
        showMenu();
      });
    });
  }

  async function submitVote() {
    rl.question("ID votación: ", async (votationId) => {
      rl.question("ID partido: ", async (partyId) => {
        rl.question("ID municipio: ", async (municipalityId) => {
          rl.question("Texto del voto (para hash): ", async (voteText) => {
            try {
              // Generar hash único
              const provider = ethers.provider;
              const block = await provider.getBlock("latest");
              const voteHash = ethers.keccak256(ethers.toUtf8Bytes(`voto_${block.timestamp}_${votationId}_${voteText}`));
              
              const tx = await simpleVoting.submitVote(
                parseInt(partyId),
                parseInt(votationId),
                parseInt(municipalityId),
                voteHash
              );
              const receipt = await tx.wait();
              
              console.log("Voto emitido exitosamente!");
              console.log("Transaction:", receipt.transactionHash);
              console.log("Gas usado:", receipt.gasUsed.toString());
            } catch (error) {
              console.log("Error al emitir voto:", error.message);
            }
            showMenu();
          });
        });
      });
    });
  }

  async function updateVotation() {
    rl.question("ID votación a actualizar: ", async (votationId) => {
      rl.question("Nuevo título: ", async (title) => {
        rl.question("Nueva descripción: ", async (desc) => {
          // Obtener timestamp del bloque
          const provider = ethers.provider;
          const block = await provider.getBlock("latest");
          const now = block.timestamp;
          const end = now + 7200; // +2 horas
          const state = 0; // Active por defecto
          try {
            const tx = await simpleVoting.updateVotation(parseInt(votationId), title, desc, now, end, state);
            const receipt = await tx.wait();
            console.log("Votación actualizada!");
            console.log("Transaction:", receipt.transactionHash);
            console.log("Gas usado:", receipt.gasUsed.toString());
          } catch (error) {
            console.log("Error actualizando votación:", error.message);
          }
          showMenu();
        });
      });
    });
  }

  async function cancelVotation() {
    rl.question("ID votación a cancelar: ", async (votationId) => {
      rl.question("Motivo de cancelación: ", async (reason) => {
        try {
          const tx = await simpleVoting.cancelVotation(parseInt(votationId), reason);
          const receipt = await tx.wait();
          console.log("Votación cancelada!");
          console.log("Transaction:", receipt.transactionHash);
          console.log("Gas usado:", receipt.gasUsed.toString());
        } catch (error) {
          console.log("Error cancelando votación:", error.message);
        }
        showMenu();
      });
    });
  }

  async function finishVotation() {
    rl.question("ID votación a finalizar: ", async (votationId) => {
      try {
        const tx = await simpleVoting.finishVotation(parseInt(votationId));
        const receipt = await tx.wait();
        console.log("Votación finalizada!");
        console.log("Transaction:", receipt.transactionHash);
        console.log("Gas usado:", receipt.gasUsed.toString());
      } catch (error) {
        console.log("Error finalizando votación:", error.message);
      }
      showMenu();
    });
  }

  showMenu();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });