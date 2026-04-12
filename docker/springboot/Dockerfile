# Multi-stage build: Compila el JAR y luego lo ejecuta
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

COPY ./votations/pom.xml .
RUN mvn dependency:go-offline -B

COPY ./votations/src ./src

# Copio el contrato Solidity desde blockchain/contracts
COPY ./blockchain/contracts/SimpleVoting.sol ./src/main/resources/contracts/

# Genero clases del contrato Web3j
RUN mvn web3j:generate-sources -B

# Compilo el proyecto (sin clean para no borrar las clases generadas)
RUN mvn package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache curl
COPY --from=builder /build/target/*.jar app.jar
EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]