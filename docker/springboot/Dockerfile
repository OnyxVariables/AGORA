# Multi-stage build: Compila el JAR y luego lo ejecuta
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

FROM maven:3.9-eclipse-temurin-21 AS builder

COPY ./votations/pom.xml .
RUN mvn dependency:go-offline -B

COPY ./votations/src ./src
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache curl
COPY --from=builder /build/target/*.jar app.jar
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]