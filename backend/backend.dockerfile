FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /workspace


# samo pom.xml → dependency cache
COPY pom.xml .
RUN mvn -B dependency:go-offline

# tek sad source kod
COPY src ./src

# build (brz ako se samo kod mijenja)
RUN mvn -B package -DskipTests


FROM eclipse-temurin:21-jre-jammy AS backend-service

WORKDIR /app

COPY --from=builder /workspace/target/*.jar app.jar

ARG PORT=8080
ENV PORT=${PORT}
EXPOSE ${PORT}

ENTRYPOINT ["java","-jar","app.jar"]